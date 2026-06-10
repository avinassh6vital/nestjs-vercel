import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMeterReadingDto } from './dto/create-meter_reading.dto';
import { UpdateMeterReadingDto } from './dto/update-meter_reading.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterReading } from './entities/meter_reading.entity';
import { buildQueryOptions } from '../utils/filter.util';
import { MembersService } from '../members/members.service';

@Injectable()
export class MeterReadingService {

  constructor(
    @InjectRepository(MeterReading)
    private meterReadingRepository: Repository<MeterReading>,
    private readonly membersService: MembersService,
  ) {}

  async create(createMeterReadingDto: CreateMeterReadingDto) {
    if (createMeterReadingDto.memberId) {
      const member = await this.membersService.findOne(createMeterReadingDto.memberId);
      if (!member) {
        throw new NotFoundException(`Member with ID ${createMeterReadingDto.memberId} not found`);
      }
    }
    const meterReading = this.meterReadingRepository.create(
      createMeterReadingDto,
    );
    const saved = await this.meterReadingRepository.save(meterReading);
    saved.currentReading = Number(saved.currentReading);
    if (saved.previousReading !== undefined && saved.previousReading !== null) {
      saved.previousReading = Number(saved.previousReading);
    }
    return saved;
  }

  async findAll(
    page = 1,
    limit = 10,
    searchTerm = '',
    sort = '',
    filters: Record<string, any> = {},
  ) {
    const searchFields = ['notes'];
    const queryOptions = buildQueryOptions<MeterReading>(
      page,
      limit,
      searchTerm,
      sort,
      filters,
      searchFields,
    );
    queryOptions.relations = ['member'];

    const [meterReadings, total] = await this.meterReadingRepository.findAndCount(queryOptions);
    
    const mappedMeterReadings = meterReadings.map(item => ({
      ...item,
      currentReading: Number(item.currentReading),
      previousReading: item.previousReading !== null && item.previousReading !== undefined 
      ? Number(item.previousReading) 
      : undefined,
    }));

    const totalAmount = mappedMeterReadings.reduce((sum, item) => sum + item.currentReading, 0);

    return {
      meterReadings: mappedMeterReadings,
      total,
      page,
      limit,
      totalAmount,
    };
  }

  async findOne(id: string) {
    const meterReading = await this.meterReadingRepository.findOne({
      where: { id },
      relations: ['member'],
    });
    if (meterReading) {
      meterReading.currentReading = Number(meterReading.currentReading);
      if (meterReading.previousReading !== null && meterReading.previousReading !== undefined) {
        meterReading.previousReading = Number(meterReading.previousReading);
      }
    }
    return meterReading;
  }

  async update(id: string, updateMeterReadingDto: UpdateMeterReadingDto) {
    if (updateMeterReadingDto.memberId) {
      const member = await this.membersService.findOne(updateMeterReadingDto.memberId);
      if (!member) {
        throw new NotFoundException(`Member with ID ${updateMeterReadingDto.memberId} not found`);
      }
    }
    await this.meterReadingRepository.update(id, updateMeterReadingDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const meterReading = await this.findOne(id);
    if (meterReading) {
      await this.meterReadingRepository.remove(meterReading);
    }
    return { deleted: true };
  }
}

