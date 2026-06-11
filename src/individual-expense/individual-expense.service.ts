import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IndividualExpense } from './entities/individual-expense.entity';
import { CreateIndividualExpenseDto } from './dto/create-individual-expense.dto';
import { UpdateIndividualExpenseDto } from './dto/update-individual-expense.dto';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';
import { MembersService } from '../members/members.service';
import { buildQueryOptions } from '../utils/filter.util';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class IndividualExpenseService {
  constructor(
    @InjectRepository(IndividualExpense)
    private readonly individualExpenseRepository: Repository<IndividualExpense>,
    @InjectRepository(MeterReading)
    private readonly meterReadingRepository: Repository<MeterReading>,
    private readonly membersService: MembersService,
    private readonly expensesService: ExpensesService,
  ) {}

  async create(dto: CreateIndividualExpenseDto) {
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
    const searchFields = ['notes'];
    const queryOptions = buildQueryOptions<IndividualExpense>(
      this.individualExpenseRepository,
      page,
      limit,
      searchTerm,
      sort,
      filters,
      searchFields,
    );
    queryOptions.relations = ['member', 'meterReading'];

    const [data, total] = await this.individualExpenseRepository.findAndCount(queryOptions);

    const mappedData = data.map((item) => ({
      ...item,
      meterReadingTotal: Number(item.meterReadingTotal),
      ratePerUnit: Number(item.ratePerUnit),
      totalExpense: Number(item.totalExpense),
    }));

    const totalAmount = mappedData.reduce((sum, item) => sum + item.totalExpense, 0);

    return {
      expenses: mappedData,
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

  async update(id: string, dto: UpdateIndividualExpenseDto) {
    const current = await this.findOne(id);
    if (!current) {
      throw new NotFoundException(`Individual expense with ID ${id} not found`);
    }

    const updateData: any = { ...dto };

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
}
