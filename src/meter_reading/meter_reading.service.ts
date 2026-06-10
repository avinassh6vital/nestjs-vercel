import { Injectable } from '@nestjs/common';
import { CreateMeterReadingDto } from './dto/create-meter_reading.dto';
import { UpdateMeterReadingDto } from './dto/update-meter_reading.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterReading } from './entities/meter_reading.entity';

@Injectable()
export class MeterReadingService {

  constructor(
    @InjectRepository(MeterReading)
    private meterReadingRepository: Repository<MeterReading>,
  ) {}

  // create(createMeterReadingDto: CreateMeterReadingDto) {
  //   return 'This action adds a new meterReading';
  // }

  create(createMeterReadingDto: CreateMeterReadingDto) {
    const meterReading = this.meterReadingRepository.create(
      createMeterReadingDto,
    );
    return this.meterReadingRepository.save(meterReading);
  }

  // findAll() {
  //   return `This action returns all meterReading`;
  // }

  async findAll() {
    const meterReadings = await this.meterReadingRepository.find();
    const totalAmount = meterReadings.reduce((sum, item) => sum + item.currentReading, 0);
    return { meterReadings, totalAmount };
  }

  findOne(id: number) {
    return `This action returns a #${id} meterReading`;
  }

  update(id: number, updateMeterReadingDto: UpdateMeterReadingDto) {
    return `This action updates a #${id} meterReading`;
  }

  remove(id: number) {
    return `This action removes a #${id} meterReading`;
  }
}
