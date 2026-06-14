import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionAmountService } from './collection-amount.service';
import { CollectionAmountController } from './collection-amount.controller';
import { CollectionAmount } from './entities/collection-amount.entity';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [TypeOrmModule.forFeature([CollectionAmount]), MembersModule],
  controllers: [CollectionAmountController],
  providers: [CollectionAmountService],
})
export class CollectionAmountModule {}


