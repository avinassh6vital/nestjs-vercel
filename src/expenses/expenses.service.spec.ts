import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { MeterReading } from '../meter_reading/entities/meter_reading.entity';
import { CollectionAmount } from '../collection-amount/entities/collection-amount.entity';

describe('ExpensesService', () => {
  let service: ExpensesService;

  const mockExpensesRepository = {
    find: jest.fn(),
  };

  const mockMeterReadingRepository = {
    find: jest.fn(),
  };

  const mockCollectionAmountRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpensesRepository,
        },
        {
          provide: getRepositoryToken(MeterReading),
          useValue: mockMeterReadingRepository,
        },
        {
          provide: getRepositoryToken(CollectionAmount),
          useValue: mockCollectionAmountRepository,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview data with totalCollected and overbal', async () => {
      mockMeterReadingRepository.find.mockResolvedValue([
        { currentReading: 1200, previousReading: 200 }, // consumption = 1000
      ]);
      mockExpensesRepository.find.mockResolvedValue([
        { type: 'water', amount: 3000 },
        { type: 'maintenance', amount: 17000 },
      ]);
      mockCollectionAmountRepository.find.mockResolvedValue([
        { amount: 25000 },
      ]);

      const result = await service.getOverview('2026-06');

      expect(result.selectedMonth).toBe('2026-06');
      expect(result.totalMeterReading).toBe(1000);
      expect(result.totalWaterAmount).toBe(3000);
      expect(result.totalOtherExpenseAmount).toBe(17000);
      expect(result.oneLiterCharge).toBe(3);
      expect(result.totalAllExpense).toBe(20000);
      expect(result.totalCollected).toBe(25000);
      expect(result.overbal).toBe(5000);
    });
  });
});
