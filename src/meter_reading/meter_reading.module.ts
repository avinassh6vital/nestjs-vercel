import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterReadingService } from './meter_reading.service';
import { MeterReadingController } from './meter_reading.controller';
import { MeterReading } from './entities/meter_reading.entity';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [TypeOrmModule.forFeature([MeterReading]), MembersModule],
  controllers: [MeterReadingController],
  providers: [MeterReadingService],
})
export class MeterReadingModule {}

