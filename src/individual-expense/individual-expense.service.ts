import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { IndividualExpense } from './entities/individual-expense.entity';
import { CreateIndividualExpenseDto } from './dto/create-individual-expense.dto';
import { UpdateIndividualExpenseDto } from './dto/update-individual-expense.dto';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';
import { Member } from '../members/entities/member.entity';
import { CollectionAmount } from '../collection-amount/entities/collection-amount.entity';
import { MembersService } from '../members/members.service';
import { buildQueryOptions } from '../utils/filter.util';
import { ExpensesService } from '../expenses/expenses.service';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { formatYearMonth } from '../utils/date.util';

@Injectable()
export class IndividualExpenseService {
  constructor(
    @InjectRepository(IndividualExpense)
    private readonly individualExpenseRepository: Repository<IndividualExpense>,
    @InjectRepository(MeterReading)
    private readonly meterReadingRepository: Repository<MeterReading>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(CollectionAmount)
    private readonly collectionRepository: Repository<CollectionAmount>,
    private readonly membersService: MembersService,
    private readonly expensesService: ExpensesService,
  ) {}

  async create(dto: CreateIndividualExpenseDto, createdBy?: string) {
    // 1. Find active member for flatNo
    const member = await this.membersService.findByFlatNo(dto.flatNo);
    if (!member) {
      throw new NotFoundException(`Active member with flat number ${dto.flatNo} not found`);
    }

    // 2. Extract year-month prefix from the date (e.g. "2026-06-10" -> "2026-06")
    const dateStr = dto.date.substring(0, 7);

    // 3. Resolve meter reading for flatNo matching this month
    const reading = await this.meterReadingRepository.findOne({
      where: {
        flatNo: dto.flatNo,
        readingDate: Like(`${dateStr}%`),
      },
    });

    if (!reading) {
      throw new NotFoundException(
        `Meter reading for flat number ${dto.flatNo} in month ${dateStr} not found`,
      );
    }

    // 4. Calculate consumption (meterReadingTotal)
    const current = Number(reading.currentReading);
    const previous = Number(reading.previousReading ?? 0);
    const meterReadingTotal = current - previous;
    if (meterReadingTotal < 0) {
      throw new BadRequestException(
        `Invalid consumption calculation: current reading (${current}) is less than previous reading (${previous})`,
      );
    }

    // 5. Calculate total expense using the dynamic oneLiterCharge from expenses overview
    const overview = await this.expensesService.getOverview(dateStr);
    const ratePerUnit = overview.oneLiterCharge;
    const totalExpense = meterReadingTotal * ratePerUnit;

    // 6. Create entity
    const expense = this.individualExpenseRepository.create({
      flatNo: dto.flatNo,
      memberId: member.id,
      meterReadingId: reading.id,
      meterReadingTotal,
      ratePerUnit,
      totalExpense,
      date: new Date(dto.date),
      notes: dto.notes,
      createdBy,
    });

    const saved = await this.individualExpenseRepository.save(expense);
    saved.meterReadingTotal = Number(saved.meterReadingTotal);
    saved.ratePerUnit = Number(saved.ratePerUnit);
    saved.totalExpense = Number(saved.totalExpense);
    return saved;
  }

  async findAll(
    page = 1,
    limit = 10,
    searchTerm = '',
    sort = '',
    filters: Record<string, any> = {},
  ) {
    // Resolve target month from query filters, default to current month YYYY-MM
    let selectedMonth = new Date().toISOString().substring(0, 7);
    if (filters) {
      if (typeof filters.date === 'string') {
        selectedMonth = filters.date.substring(0, 7);
      } else if (typeof filters.fromDate === 'string') {
        selectedMonth = filters.fromDate.substring(0, 7);
      } else if (typeof filters.toDate === 'string') {
        selectedMonth = filters.toDate.substring(0, 7);
      }
    }

    // 1. Get billing overview to get dynamic rate
    const overview = await this.expensesService.getOverview(selectedMonth);
    const ratePerUnit = overview.oneLiterCharge;

    // 2. Find all active members
    const members = await this.memberRepository.find({
      where: { active: true },
    });

    // 3. Find all meter readings for the target month
    const readings = await this.meterReadingRepository.find({
      where: {
        readingDate: Like(`${selectedMonth}%`),
      },
      relations: ['member'],
    });

    const { startDateStr, endDateStr } = this.getDateRangeForMonth(selectedMonth);

    // Get all other (non-water) expenses to split among active flats
    const expensesData = await this.expensesService.findAll(1, 1000, '', '', {
      fromDate: startDateStr,
      toDate: endDateStr,
    });
    const otherExpenses = expensesData.expenses.filter((e) => e.type !== 'water');
    const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const splitShare = members.length > 0 ? Math.round(totalOtherExpenses / members.length) : 0;

    // Fetch all collections and DB individual expenses in batch queries
    const allCollections = await this.collectionRepository.find();
    const allDbExpenses = await this.individualExpenseRepository.find();
    const allGeneralExpensesRes = await this.expensesService.findAll(1, 100000);
    const allGeneralExpenses = allGeneralExpensesRes.expenses;

    const splitShareCache: Record<string, number> = {};
    const resolveSplitShare = (monthStr: string) => {
      if (splitShareCache[monthStr] === undefined) {
        if (monthStr === selectedMonth) {
          splitShareCache[monthStr] = splitShare;
        } else {
          const [yearStr, monthNumStr] = monthStr.split('-');
          const year = parseInt(yearStr, 10);
          const monthNum = parseInt(monthNumStr, 10);
          const start = new Date(year, monthNum - 1, 1);
          const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

          const monthExpenses = allGeneralExpenses.filter((e) => {
            const d = new Date(e.date);
            return d >= start && d <= end && e.type !== 'water';
          });
          const totalAmount = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
          splitShareCache[monthStr] = members.length > 0 ? Math.round(totalAmount / members.length) : 0;
        }
      }
      return splitShareCache[monthStr];
    };

    // 4. Construct computed individual expense records in memory
    const allExpenses = members.map((member) => {
      const reading = readings.find((r) => r.flatNo === member.flatNo);
      const current = reading ? Number(reading.currentReading) : 0;
      const previous = reading ? Number(reading.previousReading ?? 0) : 0;
      const meterReadingTotal = Math.max(0, current - previous);
      const waterExpense = meterReadingTotal * ratePerUnit;
      const totalExpense = Math.round(waterExpense + splitShare);

      // Sum collections for this flat
      const flatCollections = allCollections.filter((c) => c.flatNo === member.flatNo);
      const totalCollected = flatCollections.reduce((sum, col) => sum + Number(col.amount), 0);

      // Sum individual expenses for this flat (excluding current month)
      const flatDbExpenses = allDbExpenses.filter((e) => e.flatNo === member.flatNo);
      const otherMonthsDbExpenses = flatDbExpenses.filter((e) => {
        const mStr = formatYearMonth(e.date);
        return mStr !== selectedMonth;
      });

      let cumulativeExpense = 0;
      otherMonthsDbExpenses.forEach((ie) => {
        const monthStr = formatYearMonth(ie.date);
        const monthSplit = resolveSplitShare(monthStr);
        cumulativeExpense += Number(ie.totalExpense) + monthSplit;
      });

      // Add current month's calculated totalExpense
      cumulativeExpense += totalExpense;

      // Available balance = totalCollected - cumulativeExpense
      const availableBalance = totalCollected - cumulativeExpense;

      return {
        id: reading ? reading.id : null,
        flatNo: member.flatNo,
        memberId: member.id,
        member,
        meterReadingId: reading ? reading.id : null,
        meterReading: reading || null,
        meterReadingTotal,
        ratePerUnit,
        waterExpense,
        otherExpenseShare: splitShare,
        totalExpense,
        totalCollected,
        availableBalance,
        date: reading ? new Date(reading.readingDate) : new Date(`${selectedMonth}-01`),
        notes: reading?.notes || 'No meter reading recorded',
        createdAt: reading ? reading.createdAt : new Date(),
        updatedAt: reading ? reading.updatedAt : new Date(),
      };
    });

    // 5. In-memory filtering (Search)
    let filteredExpenses = allExpenses;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredExpenses = allExpenses.filter(
        (exp) =>
          exp.flatNo.toLowerCase().includes(searchLower) ||
          exp.notes.toLowerCase().includes(searchLower) ||
          `${exp.member.firstName} ${exp.member.lastName}`
            .toLowerCase()
            .includes(searchLower),
      );
    }

    // 6. In-memory filtering (Filters)
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (key === 'date' || key === 'fromDate' || key === 'toDate') {
          return; // Already resolved for selectedMonth
        }
        const val = filters[key];
        if (val === undefined || val === null || val === '') {
          return;
        }
        const valStr = String(val).toLowerCase();
        if (key === 'flatNo') {
          filteredExpenses = filteredExpenses.filter((exp) =>
            exp.flatNo.toLowerCase().includes(valStr),
          );
        } else if (key === 'memberId') {
          filteredExpenses = filteredExpenses.filter((exp) => exp.memberId === val);
        }
      });
    }

    // 7. In-memory Sorting
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach((field) => {
        const [key, direction] = field.split(':');
        const isDesc = direction?.toUpperCase() === 'DESC';
        filteredExpenses.sort((a: any, b: any) => {
          let valA = a[key];
          let valB = b[key];

          if (key === 'memberName') {
            valA = `${a.member.firstName} ${a.member.lastName}`;
            valB = `${b.member.firstName} ${b.member.lastName}`;
          }

          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (typeof valA === 'string' && typeof valB === 'string') {
            return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
          }
          return isDesc ? (valB > valA ? 1 : -1) : valA > valB ? 1 : -1;
        });
      });
    } else {
      // Default sorting: sort by flatNo ASC
      filteredExpenses.sort((a, b) => a.flatNo.localeCompare(b.flatNo));
    }

    // 8. Pagination and totals calculation
    const total = filteredExpenses.length;
    const skip = (page - 1) * limit;
    const paginatedExpenses = filteredExpenses.slice(skip, skip + limit);
    const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.totalExpense, 0);

    return {
      expenses: paginatedExpenses,
      total,
      page,
      limit,
      totalAmount,
    };
  }

  async findOne(id: string) {
    const item = await this.individualExpenseRepository.findOne({
      where: { id },
      relations: ['member', 'meterReading'],
    });
    if (item) {
      item.meterReadingTotal = Number(item.meterReadingTotal);
      item.ratePerUnit = Number(item.ratePerUnit);
      item.totalExpense = Number(item.totalExpense);
    }
    return item;
  }

  async update(id: string, dto: UpdateIndividualExpenseDto, updatedBy?: string) {
    const current = await this.findOne(id);
    if (!current) {
      throw new NotFoundException(`Individual expense with ID ${id} not found`);
    }

    const updateData: any = { ...dto, updatedBy };

    const targetFlatNo = dto.flatNo !== undefined ? dto.flatNo : current.flatNo;
    const targetDate = dto.date !== undefined ? dto.date : current.date.toISOString().substring(0, 10);

    let memberId = current.memberId;
    if (dto.flatNo !== undefined) {
      const member = await this.membersService.findByFlatNo(dto.flatNo);
      if (!member) {
        throw new NotFoundException(`Active member with flat number ${dto.flatNo} not found`);
      }
      memberId = member.id;
      updateData.memberId = memberId;
    }

    if (dto.flatNo !== undefined || dto.date !== undefined) {
      const dateStr = targetDate.substring(0, 7); // "YYYY-MM"
      const reading = await this.meterReadingRepository.findOne({
        where: {
          flatNo: targetFlatNo,
          readingDate: Like(`${dateStr}%`),
        },
      });
      if (!reading) {
        throw new NotFoundException(
          `Meter reading for flat number ${targetFlatNo} in month ${dateStr} not found`,
        );
      }

      const currentReadingVal = Number(reading.currentReading);
      const previousReadingVal = Number(reading.previousReading ?? 0);
      const meterReadingTotal = currentReadingVal - previousReadingVal;
      if (meterReadingTotal < 0) {
        throw new BadRequestException(
          `Invalid consumption calculation: current reading (${currentReadingVal}) is less than previous reading (${previousReadingVal})`,
        );
      }

      const overview = await this.expensesService.getOverview(dateStr);
      const ratePerUnit = overview.oneLiterCharge;

      updateData.flatNo = targetFlatNo;
      updateData.meterReadingId = reading.id;
      updateData.meterReadingTotal = meterReadingTotal;
      updateData.ratePerUnit = ratePerUnit;
      updateData.totalExpense = meterReadingTotal * ratePerUnit;
    }

    if (dto.date) {
      updateData.date = new Date(dto.date);
    }

    await this.individualExpenseRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    if (item) {
      await this.individualExpenseRepository.remove(item);
    }
    return { deleted: true };
  }

  async generateExpensePdf(flatNo: string, month: string, res: Response) {
    const selectedMonth = this.validateAndNormalizeMonth(month);
    const { startDate, endDate, startDateStr, endDateStr } = this.getDateRangeForMonth(selectedMonth);

    // 1. Find active member
    const member = await this.membersService.findByFlatNo(flatNo);
    if (!member) {
      throw new NotFoundException(`Active member with flat number ${flatNo} not found`);
    }

    // 2. Get meter reading
    const reading = await this.meterReadingRepository.findOne({
      where: {
        flatNo,
        readingDate: Like(`${selectedMonth}%`),
      },
    });
    if (!reading) {
      throw new NotFoundException(
        `Meter reading for flat number ${flatNo} in month ${selectedMonth} not found`,
      );
    }

    const current = Number(reading.currentReading);
    const previous = Number(reading.previousReading ?? 0);
    const consumption = current - previous;
    if (consumption < 0) {
      throw new BadRequestException(
        `Invalid consumption: current reading (${current}) is less than previous reading (${previous})`,
      );
    }

    // 3. Get rate and overview
    const overview = await this.expensesService.getOverview(selectedMonth);
    const ratePerUnit = overview.oneLiterCharge;
    const waterCost = consumption * ratePerUnit;

    // 4. Get other expenses list
    const expensesData = await this.expensesService.findAll(1, 1000, '', '', {
      fromDate: startDateStr,
      toDate: endDateStr,
    });
    const allExpenses = expensesData.expenses;
    const otherExpenses = allExpenses.filter(e => e.type !== 'water');
    const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // 5. Get active members split
    const activeMembersCount = await this.membersService.countActive();
    const splitShare = activeMembersCount > 0 ? totalOtherExpenses / activeMembersCount : 0;
    const grandTotal = waterCost + splitShare;

    // 6. Create or retrieve individual expense
    let individualExpense = await this.individualExpenseRepository.findOne({
      where: {
        flatNo,
        date: Between(startDate, endDate),
      },
    });
    if (!individualExpense) {
      individualExpense = this.individualExpenseRepository.create({
        flatNo,
        memberId: member.id,
        meterReadingId: reading.id,
        meterReadingTotal: consumption,
        ratePerUnit,
        totalExpense: waterCost,
        date: new Date(reading.readingDate),
        notes: `Auto-generated via PDF request`,
      });
      await this.individualExpenseRepository.save(individualExpense);
    }

    // 6.1. Get historical ledger and calculate balance up to selectedMonth using MembersService
    const ledger = await this.membersService.getLedgerForFlat(flatNo);
    const currentMonthLedger = ledger.find(r => r.monthStr === selectedMonth);
    const individualCollectAmount = currentMonthLedger ? currentMonthLedger.collected : 0;

    const pastOrCurrentRows = ledger.filter(r => r.monthStr <= selectedMonth);
    const availableBalance = pastOrCurrentRows.length > 0
      ? pastOrCurrentRows[pastOrCurrentRows.length - 1].balance
      : 0;
    const displayLedgerRows = pastOrCurrentRows.slice(-4);

    // 7. Start PDF generation
    const safeFlatNo = flatNo.replace(/[\r\n"]/g, '').trim();
    const safeMonth = selectedMonth.replace(/[\r\n"]/g, '').trim();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expense-${safeFlatNo}-${safeMonth}.pdf"`,
    );

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    
    // Pipe the PDF directly to the express response
    doc.pipe(res);

    // COLORS
    const primaryColor = '#1A365D'; // Navy
    const secondaryColor = '#2B6CB0'; // Slate Blue
    const darkNeutral = '#2D3748'; // Charcoal
    const lightNeutral = '#F7FAF9'; // Off-white/light-grey
    const borderGrey = '#E2E8F0';

    // ---------------- HEADER BANNER ----------------
    doc.rect(40, 40, 515, 75).fill(primaryColor);
    
    doc.fillColor('#FFFFFF')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('MONTHLY UTILITY INVOICE', 60, 55);
       
    const billingPeriod = `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Billing Period: ${billingPeriod}`, 60, 85);
       
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`INVOICE: #${individualExpense.id.substring(0, 8).toUpperCase()}`, 400, 55, { align: 'right', width: 135 });
       
    doc.fontSize(9)
       .font('Helvetica')
       .text(`Date: ${this.formatDate(new Date())}`, 400, 75, { align: 'right', width: 135 });

    // ---------------- MEMBER & FLAT DETAILS ----------------
    let currentY = 135;
    doc.fillColor(darkNeutral);
    
    // Title for section
    doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('MEMBER DETAILS', 40, currentY);
    doc.moveTo(40, currentY + 15).lineTo(260, currentY + 15).strokeColor(borderGrey).stroke();
    
    // Details List
    doc.fillColor(darkNeutral).fontSize(9).font('Helvetica');
    doc.text(`Name:`, 40, currentY + 25);
    doc.font('Helvetica-Bold').text(`${member.firstName} ${member.lastName}`, 110, currentY + 25);
    
    doc.font('Helvetica').text(`Phone:`, 40, currentY + 40);
    doc.font('Helvetica-Bold').text(`${member.phoneNumber}`, 110, currentY + 40);
    
    doc.font('Helvetica').text(`Flat Number:`, 40, currentY + 55);
    doc.font('Helvetica-Bold').text(`${member.flatNo}`, 110, currentY + 55);

    // Right side meta card
    doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('SUMMARY', 320, currentY);
    doc.moveTo(320, currentY + 15).lineTo(555, currentY + 15).strokeColor(borderGrey).stroke();
    
    doc.fillColor(darkNeutral).fontSize(9).font('Helvetica');
    doc.text(`Water Consumption:`, 320, currentY + 25);
    doc.font('Helvetica-Bold').text(`${consumption.toFixed(2)} units (Liters)`, 450, currentY + 25);
    
    doc.font('Helvetica').text(`Water Rate / Unit:`, 320, currentY + 40);
    doc.font('Helvetica-Bold').text(`Rs. ${ratePerUnit.toFixed(4)}`, 450, currentY + 40);

    // ---------------- SECTION: WATER CONSUMPTION (METER READING) ----------------
    currentY = 220;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('WATER METER READING BREAKDOWN', 40, currentY);
    
    // Table Header
    doc.rect(40, currentY + 15, 515, 20).fill(secondaryColor);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
    doc.text('Reading Date', 50, currentY + 21);
    doc.text('Previous Reading', 180, currentY + 21, { width: 100, align: 'right' });
    doc.text('Current Reading', 310, currentY + 21, { width: 100, align: 'right' });
    doc.text('Consumption (Units)', 440, currentY + 21, { width: 100, align: 'right' });
    
    // Table Row
    doc.fillColor(darkNeutral).font('Helvetica').fontSize(9);
    doc.text(this.formatDate(reading.readingDate), 50, currentY + 42);
    doc.text(previous.toFixed(2), 180, currentY + 42, { width: 100, align: 'right' });
    doc.text(current.toFixed(2), 310, currentY + 42, { width: 100, align: 'right' });
    doc.text(consumption.toFixed(2), 440, currentY + 42, { width: 100, align: 'right' });
    
    // Draw a box around the row
    doc.rect(40, currentY + 35, 515, 25).strokeColor(borderGrey).stroke();
    
    // Water cost summary line
    doc.rect(40, currentY + 65, 515, 22).fill(lightNeutral);
    doc.fillColor(darkNeutral).font('Helvetica-Bold').fontSize(9);
    doc.text('Water Cost Subtotal (Consumption x Rate):', 50, currentY + 71);
    doc.text(`Rs. ${waterCost.toFixed(2)}`, 440, currentY + 71, { width: 100, align: 'right' });
    doc.rect(40, currentY + 65, 515, 22).strokeColor(borderGrey).stroke();

    // ---------------- SECTION: OTHER SHAREABLE EXPENSES ----------------
    currentY = 325;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('SHARED GENERAL MAINTENANCE EXPENSES', 40, currentY);
    
    // Table Header for Other Expenses
    doc.rect(40, currentY + 15, 515, 20).fill(secondaryColor);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
    doc.text('Expense Category / Type', 50, currentY + 21);
    doc.text('Date', 230, currentY + 21);
    doc.text('Description', 320, currentY + 21);
    doc.text('Amount', 440, currentY + 21, { width: 100, align: 'right' });

    let expenseY = currentY + 35;
    if (otherExpenses.length === 0) {
      doc.fillColor(darkNeutral).font('Helvetica-Oblique').fontSize(9);
      doc.text('No general shared expenses recorded for this month.', 50, expenseY + 6);
      doc.rect(40, expenseY, 515, 22).strokeColor(borderGrey).stroke();
      expenseY += 22;
    } else {
      const maxRows = 6;
      const displayExpenses = otherExpenses.slice(0, maxRows);
      
      displayExpenses.forEach((exp, idx) => {
        if (idx % 2 === 1) {
          doc.rect(40, expenseY, 515, 20).fill('#F7FAFC');
        }
        
        doc.fillColor(darkNeutral).font('Helvetica').fontSize(9);
        const typeStr = exp.type.charAt(0).toUpperCase() + exp.type.slice(1);
        doc.text(typeStr, 50, expenseY + 5);
        doc.text(this.formatDate(exp.date), 230, expenseY + 5);
        
        const desc = exp.description || exp.comments || '-';
        const truncatedDesc = desc.length > 22 ? desc.substring(0, 20) + '...' : desc;
        doc.text(truncatedDesc, 320, expenseY + 5);
        doc.text(`Rs. ${Number(exp.amount).toFixed(2)}`, 440, expenseY + 5, { width: 100, align: 'right' });
        
        doc.rect(40, expenseY, 515, 20).strokeColor(borderGrey).stroke();
        expenseY += 20;
      });

      if (otherExpenses.length > maxRows) {
        const remainingCount = otherExpenses.length - maxRows;
        const remainingAmount = otherExpenses.slice(maxRows).reduce((sum, e) => sum + Number(e.amount), 0);
        
        doc.fillColor(darkNeutral).font('Helvetica-Oblique').fontSize(9);
        doc.text(`+ ${remainingCount} other general expense items`, 50, expenseY + 5);
        doc.text(`Rs. ${remainingAmount.toFixed(2)}`, 440, expenseY + 5, { width: 100, align: 'right' });
        doc.rect(40, expenseY, 515, 20).strokeColor(borderGrey).stroke();
        expenseY += 20;
      }
    }

    // Shared expenses split calculation block
    doc.rect(40, expenseY, 515, 45).fill(lightNeutral);
    doc.fillColor(darkNeutral).font('Helvetica').fontSize(8.5);
    doc.text(`Total Shared Maintenance Pool:`, 50, expenseY + 8);
    doc.font('Helvetica-Bold').text(`Rs. ${totalOtherExpenses.toFixed(2)}`, 220, expenseY + 8);
    
    doc.font('Helvetica').text(`Total Active Flats / Members:`, 50, expenseY + 20);
    doc.font('Helvetica-Bold').text(`${activeMembersCount}`, 220, expenseY + 20);
    
    doc.font('Helvetica-Bold').fontSize(9).text('Your Split Share (Pool / Active Flats):', 50, expenseY + 32);
    doc.text(`Rs. ${splitShare.toFixed(2)}`, 440, expenseY + 32, { width: 100, align: 'right' });
    
    doc.rect(40, expenseY, 515, 45).strokeColor(borderGrey).stroke();
    expenseY += 45;

    // ---------------- FINAL TOTAL INVOICE SUMMARY ----------------
    const summaryY = expenseY + 25;

    // Left side: Account Statement Summary Card
    doc.rect(40, summaryY, 250, 75).strokeColor(secondaryColor).lineWidth(1.5).stroke();
    doc.rect(41, summaryY + 1, 248, 20).fill(secondaryColor);
    
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
    doc.text('ACCOUNT BALANCE SUMMARY', 50, summaryY + 7);
    
    doc.fillColor(darkNeutral).font('Helvetica').fontSize(9);
    doc.text('Monthly Expense Amount:', 50, summaryY + 30);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 175, summaryY + 30, { width: 100, align: 'right' });
    
    doc.text('Monthly Collected Amount:', 50, summaryY + 45);
    doc.text(`Rs. ${individualCollectAmount.toFixed(2)}`, 175, summaryY + 45, { width: 100, align: 'right' });
    
    doc.moveTo(50, summaryY + 58).lineTo(280, summaryY + 58).strokeColor(borderGrey).lineWidth(1).stroke();
    doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(10);
    doc.text('Remainder Balance:', 50, summaryY + 63);
    
    const balanceSign = availableBalance >= 0 ? '+' : '';
    const balanceLabel = availableBalance >= 0 ? ' (Credit)' : ' (Due)';
    doc.text(`${balanceSign}Rs. ${availableBalance.toFixed(2)}${balanceLabel}`, 155, summaryY + 63, { width: 125, align: 'right' });

    // Right side: Total Due Breakdown Card
    doc.rect(305, summaryY, 250, 75).strokeColor(primaryColor).lineWidth(1.5).stroke();
    doc.rect(306, summaryY + 1, 248, 20).fill(primaryColor);
    
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
    doc.text('TOTAL DUE BREAKDOWN', 315, summaryY + 7);
    
    doc.fillColor(darkNeutral).font('Helvetica').fontSize(9);
    doc.text('Water Utility Cost:', 315, summaryY + 30);
    doc.text(`Rs. ${waterCost.toFixed(2)}`, 440, summaryY + 30, { width: 100, align: 'right' });
    
    doc.text('Shared Maintenance Share:', 315, summaryY + 45);
    doc.text(`Rs. ${splitShare.toFixed(2)}`, 440, summaryY + 45, { width: 100, align: 'right' });
    
    doc.moveTo(315, summaryY + 58).lineTo(545, summaryY + 58).strokeColor(borderGrey).lineWidth(1).stroke();
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11);
    doc.text('Grand Total Due:', 315, summaryY + 63);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 440, summaryY + 63, { width: 100, align: 'right' });

    // ---------------- SECTION: MEMBER STATEMENT LEDGER ----------------
    const ledgerY = summaryY + 95;
    
    if (displayLedgerRows.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('MEMBER STATEMENT LEDGER', 40, ledgerY);
      
      // Table Header for Ledger
      doc.rect(40, ledgerY + 15, 515, 20).fill(secondaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
      doc.text('Billing Month', 50, ledgerY + 21);
      doc.text('Individual Expense', 150, ledgerY + 21, { width: 120, align: 'right' });
      doc.text('Individual Collected', 290, ledgerY + 21, { width: 120, align: 'right' });
      doc.text('Remainder Balance', 430, ledgerY + 21, { width: 110, align: 'right' });
      
      let rowY = ledgerY + 35;
      displayLedgerRows.forEach((row, idx) => {
        if (idx % 2 === 1) {
          doc.rect(40, rowY, 515, 20).fill('#F7FAFC');
        }
        
        doc.fillColor(darkNeutral).font('Helvetica').fontSize(9);
        const [yStr, mStr] = row.monthStr.split('-');
        const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1);
        const formattedMonth = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        });
        
        doc.text(formattedMonth, 50, rowY + 5);
        doc.text(`Rs. ${row.expense.toFixed(2)}`, 150, rowY + 5, { width: 120, align: 'right' });
        doc.text(`Rs. ${row.collected.toFixed(2)}`, 290, rowY + 5, { width: 120, align: 'right' });
        
        const balSign = row.balance >= 0 ? '+' : '';
        const balLabel = row.balance >= 0 ? ' (Credit)' : ' (Due)';
        doc.text(`${balSign}Rs. ${row.balance.toFixed(2)}${balLabel}`, 430, rowY + 5, { width: 110, align: 'right' });
        
        doc.rect(40, rowY, 515, 20).strokeColor(borderGrey).stroke();
        rowY += 20;
      });
    }

    // ---------------- FOOTER ----------------
    doc.fillColor('#718096')
       .font('Helvetica-Oblique')
       .fontSize(8.5)
       .text('This is a computer-generated document. Thank you for your cooperation and prompt payment!', 40, 770, { align: 'center', width: 515 });

    doc.end();
  }

  private validateAndNormalizeMonth(month?: string): string {
    const datePattern = /^\d{4}-\d{2}$/;
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = month || currentMonth;

    if (!datePattern.test(selectedMonth)) {
      throw new BadRequestException('Invalid month format. Please use YYYY-MM format.');
    }
    return selectedMonth;
  }

  private getDateRangeForMonth(selectedMonth: string): { startDateStr: string; endDateStr: string; startDate: Date; endDate: Date } {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const startDateStr = `${yearStr}-${monthStr}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDateStr = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

    return { startDateStr, endDateStr, startDate, endDate };
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

