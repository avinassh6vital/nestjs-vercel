import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ExpensesService {
  // create(createExpenseDto: CreateExpenseDto) {
  //   return 'This action adds a new expense';
  // }

  constructor(
      @InjectRepository(Expense)
      private expensesRepository: Repository<Expense>,
    ) {}

   create(createExpenseDto: CreateExpenseDto) {
      const expenses = this.expensesRepository.create(createExpenseDto);
      return this.expensesRepository.save(expenses);
    }

  findAll() {
    return `This action returns all expenses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} expense`;
  }

  update(id: number, updateExpenseDto: UpdateExpenseDto) {
    return `This action updates a #${id} expense`;
  }

  remove(id: number) {
    return `This action removes a #${id} expense`;
  }
}
