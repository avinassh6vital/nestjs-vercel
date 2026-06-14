import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Member } from './entities/member.entity';
import { CollectionAmount } from '../collection-amount/entities/collection-amount.entity';
import { IndividualExpense } from '../individual-expense/entities/individual-expense.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      CollectionAmount,
      IndividualExpense,
      Expense,
    ]),
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
