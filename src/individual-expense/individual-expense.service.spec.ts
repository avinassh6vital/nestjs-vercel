import { Test, TestingModule } from '@nestjs/testing';
import { IndividualExpenseService } from './individual-expense.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IndividualExpense } from './entities/individual-expense.entity';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';
import { MembersService } from '../members/members.service';

describe('IndividualExpenseService', () => {
  let service: IndividualExpenseService;

  const mockIndividualExpenseRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockMeterReadingRepository = {
    findOne: jest.fn(),
  };

  const mockMembersService = {
    findByFlatNo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndividualExpenseService,
        {
          provide: getRepositoryToken(IndividualExpense),
          useValue: mockIndividualExpenseRepository,
        },
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

    service = module.get<IndividualExpenseService>(IndividualExpenseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
