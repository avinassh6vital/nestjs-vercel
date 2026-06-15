import { Test, TestingModule } from '@nestjs/testing';
import { IndividualExpenseService } from './individual-expense.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IndividualExpense } from './entities/individual-expense.entity';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';
import { Member } from '../members/entities/member.entity';
import { MembersService } from '../members/members.service';
import { ExpensesService } from '../expenses/expenses.service';

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
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMemberRepository = {
    find: jest.fn(),
  };

  const mockMembersService = {
    findByFlatNo: jest.fn(),
    getLedgerForFlat: jest.fn().mockResolvedValue([]),
  };

  const mockExpensesService = {
    getOverview: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
          provide: getRepositoryToken(Member),
          useValue: mockMemberRepository,
        },
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
        {
          provide: ExpensesService,
          useValue: mockExpensesService,
        },
      ],
    }).compile();

    service = module.get<IndividualExpenseService>(IndividualExpenseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should calculate individual expenses dynamically from active members and meter readings', async () => {
      const mockOverview = { oneLiterCharge: 3.0 };
      const mockMembers = [
        { id: 'm1', flatNo: 'A101', active: true, firstName: 'John', lastName: 'Doe' },
        { id: 'm2', flatNo: 'A102', active: true, firstName: 'Jane', lastName: 'Doe' },
      ];
      const mockReadings = [
        { id: 'r1', flatNo: 'A101', currentReading: 120, previousReading: 100, readingDate: '2026-06-10' },
      ];

      mockExpensesService.getOverview.mockResolvedValue(mockOverview);
      mockMemberRepository.find.mockResolvedValue(mockMembers);
      mockMeterReadingRepository.find.mockResolvedValue(mockReadings);

      const result = await service.findAll(1, 10, '', '', { date: '2026-06-15' });

      expect(mockExpensesService.getOverview).toHaveBeenCalledWith('2026-06');
      expect(mockMemberRepository.find).toHaveBeenCalledWith({ where: { active: true } });
      expect(mockMeterReadingRepository.find).toHaveBeenCalled();

      expect(result.expenses).toHaveLength(2);
      
      const expA101 = result.expenses.find(e => e.flatNo === 'A101');
      expect(expA101).toBeDefined();
      expect(expA101!.meterReadingTotal).toBe(20);
      expect(expA101!.totalExpense).toBe(60);

      const expA102 = result.expenses.find(e => e.flatNo === 'A102');
      expect(expA102).toBeDefined();
      expect(expA102!.meterReadingTotal).toBe(0);
      expect(expA102!.totalExpense).toBe(0);
      expect(expA102!.notes).toBe('No meter reading recorded');
      
      expect(result.total).toBe(2);
      expect(result.totalAmount).toBe(60);
    });
  });
});

