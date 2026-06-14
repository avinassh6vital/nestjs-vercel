import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndividualExpenseService } from './individual-expense.service';
import { IndividualExpenseController } from './individual-expense.controller';
import { IndividualExpense } from './entities/individual-expense.entity';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';
import { MembersModule } from '../members/members.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IndividualExpense, MeterReading]),
    MembersModule,
    ExpensesModule,
  ],
  controllers: [IndividualExpenseController],
  providers: [IndividualExpenseService],
})
export class IndividualExpenseModule {}
