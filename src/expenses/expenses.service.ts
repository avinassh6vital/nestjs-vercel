import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { buildQueryOptions } from '../utils/filter.util';

@Injectable()
export class ExpensesService {
  // create(createExpenseDto: CreateExpenseDto) {
  //   return 'This action adds a new expense';
  // }

  constructor(
      @InjectRepository(Expense)
      private expensesRepository: Repository<Expense>,
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
}

