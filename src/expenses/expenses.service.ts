import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, ExpenseType } from './entities/expense.entity';
import { Repository, Between, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { buildQueryOptions } from '../utils/filter.util';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';

@Injectable()
export class ExpensesService {

  constructor(
      @InjectRepository(Expense)
      private expensesRepository: Repository<Expense>,
      @InjectRepository(MeterReading)
      private meterReadingRepository: Repository<MeterReading>,
    ) {}

   async create(createExpenseDto: CreateExpenseDto) {
      const expenses = this.expensesRepository.create(createExpenseDto);
      const saved = await this.expensesRepository.save(expenses);
      saved.amount = Number(saved.amount);
      return saved;
    }

  async findAll(
    page = 1,
    limit = 10,
    searchTerm = '',
    sort = '',
    filters: Record<string, any> = {},
  ) {
    const searchFields = ['description', 'category', 'comments'];
    const queryOptions = buildQueryOptions<Expense>(
      this.expensesRepository,
      page,
      limit,
      searchTerm,
      sort,
      filters,
      searchFields,
    );

    const [expenses, total] = await this.expensesRepository.findAndCount(queryOptions);
    
    const mappedExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount),
    }));

    const totalAmount = mappedExpenses.reduce((sum, item) => sum + item.amount, 0);

    return {
      expenses: mappedExpenses,
      total,
      page,
      limit,
      totalAmount,
    };
  }

  async findOne(id: string) {
    const expense = await this.expensesRepository.findOneBy({ id });
    if (expense) {
      expense.amount = Number(expense.amount);
    }
    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    await this.expensesRepository.update(id, updateExpenseDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const expense = await this.findOne(id);
    if (expense) {
      await this.expensesRepository.remove(expense);
    }
    return { deleted: true };
  }

  async getOverview(month?: string) {
    const datePattern = /^\d{4}-\d{2}$/;
    
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = month || currentMonth;

    if (!datePattern.test(selectedMonth)) {
      throw new BadRequestException('Invalid month format. Please use YYYY-MM format.');
    }

    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const meterReadings = await this.meterReadingRepository.find({
      where: {
        readingDate: Like(`${selectedMonth}%`),
      },
    });

    let totalMeterReading = 0;
    meterReadings.forEach((reading) => {
      const current = Number(reading.currentReading);
      const previous = Number(reading.previousReading ?? 0);
      const consumption = current - previous;
      if (consumption > 0) {
        totalMeterReading += consumption;
      }
    });

    const expenses = await this.expensesRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
    });

    let totalWaterAmount = 0;
    let totalOtherExpenseAmount = 0;

    expenses.forEach((expense) => {
      const amount = Number(expense.amount);
      if (expense.type === ExpenseType.WATER) {
        totalWaterAmount += amount;
      } else {
        totalOtherExpenseAmount += amount;
      }
    });

    const totalAllExpense = totalWaterAmount + totalOtherExpenseAmount;
    const oneLiterCharge = totalMeterReading > 0 ? totalWaterAmount / totalMeterReading : 0;

    return {
      selectedMonth,
      totalMeterReading,
      totalWaterAmount,
      totalOtherExpenseAmount,
      oneLiterCharge,
      totalAllExpense,
      meta: {
        expensesCount: expenses.length,
        meterReadingsCount: meterReadings.length,
      },
    };
  }
}

