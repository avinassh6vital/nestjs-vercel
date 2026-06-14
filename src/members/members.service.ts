import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { Repository, ILike, Between } from 'typeorm';
import { buildQueryOptions } from '../utils/filter.util';
import { CollectionAmount } from '../collection-amount/entities/collection-amount.entity';
import { IndividualExpense } from '../individual-expense/entities/individual-expense.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { formatYearMonth } from '../utils/date.util';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(CollectionAmount)
    private readonly collectionAmountRepository: Repository<CollectionAmount>,
    @InjectRepository(IndividualExpense)
    private readonly individualExpenseRepository: Repository<IndividualExpense>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(createMemberDto: CreateMemberDto, createdBy?: string) {
    if (createMemberDto.active !== false) {
      // active is true or undefined (which defaults to true)
      const existingActiveMember = await this.memberRepository.findOne({
        where: { flatNo: createMemberDto.flatNo, active: true },
      });
      if (existingActiveMember) {
        throw new BadRequestException(
          `An active member already exists for flat number ${createMemberDto.flatNo}`,
        );
      }
    }
    const member = this.memberRepository.create({
      ...createMemberDto,
      createdBy,
    });
    return this.memberRepository.save(member);
  }

  async findAll(
    page = 1,
    limit = 10,
    searchTerm = '',
    sort = '',
    filters: Record<string, any> = {},
  ) {
    const findOptions = buildQueryOptions<Member>(
      this.memberRepository,
      page,
      limit,
      searchTerm,
      sort,
      filters,
      ['firstName', 'lastName', 'phoneNumber'],
    );
    findOptions.relations = ['meterReadings', 'collectionAmounts'];
    const [data, total] = await this.memberRepository.findAndCount(findOptions);
    const mappedData = await Promise.all(
      data.map((member) => this.computeMemberBalances(member)),
    );
    return {
      data: mappedData,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: ['meterReadings', 'collectionAmounts'],
    });
    if (!member) {
      return null;
    }
    return this.computeMemberBalances(member);
  }

  findByFlatNo(flatNo: string) {
    return this.memberRepository.findOne({
      where: { flatNo, active: true },
    });
  }

  findByFirstName(firstName: string) {
    return this.memberRepository.findOne({
      where: { firstName: ILike(firstName), active: true },
    });
  }

  async update(
    id: string,
    updateMemberDto: UpdateMemberDto,
    updatedBy?: string,
  ) {
    const currentMember = await this.findOne(id);
    if (!currentMember) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const willBeActive =
      updateMemberDto.active !== undefined
        ? updateMemberDto.active
        : currentMember.active;
    const targetFlatNo =
      updateMemberDto.flatNo !== undefined
        ? updateMemberDto.flatNo
        : currentMember.flatNo;

    if (willBeActive) {
      const existingActiveMember = await this.memberRepository.findOne({
        where: { flatNo: targetFlatNo, active: true },
      });
      if (existingActiveMember && existingActiveMember.id !== id) {
        throw new BadRequestException(
          `An active member already exists for flat number ${targetFlatNo}`,
        );
      }
    }

    await this.memberRepository.update(id, {
      ...updateMemberDto,
      updatedBy,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.memberRepository.delete({ id });
  }

  async countActive(): Promise<number> {
    return this.memberRepository.count({ where: { active: true } });
  }

  async computeMemberBalances(member: Member): Promise<any> {
    const flatNo = member.flatNo;

    // 1. Get all collections for this flat number
    const collections = await this.collectionAmountRepository.find({
      where: { flatNo },
    });
    const totalCollected = collections.reduce((sum, col) => sum + Number(col.amount), 0);

    // 2. Get all individual expenses for this flat number
    const individualExpenses = await this.individualExpenseRepository.find({
      where: { flatNo },
    });

    let totalExpense = 0;
    const splitCache = new Map<string, number>();

    for (const ie of individualExpenses) {
      const monthStr = formatYearMonth(ie.date);
      let split = splitCache.get(monthStr);
      if (split === undefined) {
        split = await this.getSplitShareForMonth(monthStr);
        splitCache.set(monthStr, split);
      }
      totalExpense += Number(ie.totalExpense) + split;
    }

    const availableBalance = totalCollected - totalExpense;

    return {
      ...member,
      totalCollected,
      totalExpense,
      availableBalance,
      remainderBalance: availableBalance,
    };
  }

  async getLedgerForFlat(flatNo: string) {
    // 1. Find all collections for this flat
    const collections = await this.collectionAmountRepository.find({
      where: { flatNo },
      order: { date: 'ASC' },
    });

    // 2. Find all individual expenses for this flat
    const individualExpenses = await this.individualExpenseRepository.find({
      where: { flatNo },
      order: { date: 'ASC' },
    });

    // 3. Collect all active months
    const monthsSet = new Set<string>();
    collections.forEach((c) => {
      monthsSet.add(formatYearMonth(c.date));
    });
    individualExpenses.forEach((ie) => {
      monthsSet.add(formatYearMonth(ie.date));
    });

    // 4. Sort chronologically
    const sortedMonths = Array.from(monthsSet).sort();

    let runningCumulativeExpenses = 0;
    let runningCumulativeCollections = 0;
    const ledgerRows: {
      monthStr: string;
      expense: number;
      collected: number;
      balance: number;
    }[] = [];

    const splitCache = new Map<string, number>();

    for (const monthStr of sortedMonths) {
      // Find individual expense for this month
      const ieRecord = individualExpenses.find(
        (ie) => formatYearMonth(ie.date) === monthStr,
      );
      let monthlyExpense = 0;
      if (ieRecord) {
        let split = splitCache.get(monthStr);
        if (split === undefined) {
          split = await this.getSplitShareForMonth(monthStr);
          splitCache.set(monthStr, split);
        }
        monthlyExpense = Number(ieRecord.totalExpense) + split;
      }

      // Find collections for this month
      const monthlyCollectionsList = collections.filter(
        (c) => formatYearMonth(c.date) === monthStr,
      );
      const monthlyCollected = monthlyCollectionsList.reduce(
        (sum, col) => sum + Number(col.amount),
        0,
      );

      runningCumulativeExpenses += monthlyExpense;
      runningCumulativeCollections += monthlyCollected;
      const runningBalance = runningCumulativeCollections - runningCumulativeExpenses;

      ledgerRows.push({
        monthStr,
        expense: monthlyExpense,
        collected: monthlyCollected,
        balance: runningBalance,
      });
    }

    return ledgerRows;
  }

  async getSplitShareForMonth(monthStr: string): Promise<number> {
    const [yearStr, monthNumStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);

    // Get the first and last day of that month
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const expenses = await this.expenseRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
    });

    const otherExpenses = expenses.filter((e) => e.type !== 'water');
    const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const activeMembersCount = await this.memberRepository.count({ where: { active: true } });
    return activeMembersCount > 0 ? totalOtherExpenses / activeMembersCount : 0;
  }
}

