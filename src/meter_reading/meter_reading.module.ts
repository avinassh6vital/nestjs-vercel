import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterReadingService } from './meter_reading.service';
import { MeterReadingController } from './meter_reading.controller';
import { MeterReading } from './entities/meter_reading.entity';
import { MembersModule } from '../members/members.module';
import { IndividualExpense } from '../individual-expense/entities/individual-expense.entity';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeterReading, IndividualExpense]),
    MembersModule,
    ExpensesModule,
  ],
  controllers: [MeterReadingController],
  providers: [MeterReadingService],
})
export class MeterReadingModule {}

