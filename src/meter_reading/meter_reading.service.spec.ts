import { Test, TestingModule } from '@nestjs/testing';
import { MeterReadingService } from './meter_reading.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MeterReading } from './entities/meter_reading.entity';
import { MembersService } from '../members/members.service';

describe('MeterReadingService', () => {
  let service: MeterReadingService;

  const mockMeterReadingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockMembersService = {
    findOne: jest.fn(),
    findByFlatNo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeterReadingService,
        {
          provide: getRepositoryToken(MeterReading),
          useValue: mockMeterReadingRepository,
        },
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
      ],
    }).compile();

    service = module.get<MeterReadingService>(MeterReadingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

