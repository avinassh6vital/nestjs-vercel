import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Expense } from './entities/expense.entity';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';
import { CollectionAmount } from '../collection-amount/entities/collection-amount.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, MeterReading, CollectionAmount])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}

