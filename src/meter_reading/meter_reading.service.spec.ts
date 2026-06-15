import { Test, TestingModule } from '@nestjs/testing';
import { MeterReadingService } from './meter_reading.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MeterReading } from './entities/meter_reading.entity';
import { MembersService } from '../members/members.service';
import { IndividualExpense } from '../individual-expense/entities/individual-expense.entity';
import { ExpensesService } from '../expenses/expenses.service';
import { BadRequestException } from '@nestjs/common';

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

  const mockIndividualExpenseRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockMembersService = {
    findOne: jest.fn(),
    findByFlatNo: jest.fn(),
  };

  const mockExpensesService = {
    getOverview: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeterReadingService,
        {
          provide: getRepositoryToken(MeterReading),
          useValue: mockMeterReadingRepository,
        },
        {
          provide: getRepositoryToken(IndividualExpense),
          useValue: mockIndividualExpenseRepository,
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

    service = module.get<MeterReadingService>(MeterReadingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new reading if one does not exist for the month', async () => {
      const dto = {
        flatNo: 'A101',
        currentReading: 150,
        previousReading: 100,
        readingDate: '2026-06-15',
      };
      const mockMember = { id: 'member-id', flatNo: 'A101' };
      mockMembersService.findByFlatNo.mockResolvedValue(mockMember);
      mockMeterReadingRepository.findOne.mockResolvedValue(null);
      
      const expectedReading = { ...dto, memberId: 'member-id', id: 'reading-id' };
      mockMeterReadingRepository.create.mockReturnValue(expectedReading);
      mockMeterReadingRepository.save.mockResolvedValue(expectedReading);

      const result = await service.create(dto, 'user-id');

      expect(mockMembersService.findByFlatNo).toHaveBeenCalledWith('A101');
      expect(mockMeterReadingRepository.findOne).toHaveBeenCalled();
      expect(mockMeterReadingRepository.create).toHaveBeenCalledWith({
        ...dto,
        memberId: 'member-id',
        createdBy: 'user-id',
      });
      expect(mockMeterReadingRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...dto,
        memberId: 'member-id',
        id: 'reading-id',
        currentReading: 150,
        previousReading: 100,
      });
    });

    it('should update the existing reading if one exists for the month', async () => {
      const dto = {
        flatNo: 'A101',
        currentReading: 150,
        previousReading: 100,
        readingDate: '2026-06-15',
      };
      const mockMember = { id: 'member-id', flatNo: 'A101' };
      const existingReading = { id: 'existing-reading-id', flatNo: 'A101', readingDate: '2026-06-01' };
      
      mockMembersService.findByFlatNo.mockResolvedValue(mockMember);
      mockMeterReadingRepository.findOne.mockResolvedValue(existingReading);
      
      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue({
        id: 'existing-reading-id',
        ...dto,
        memberId: 'member-id',
      } as any);

      const result = await service.create(dto, 'user-id');

      expect(mockMembersService.findByFlatNo).toHaveBeenCalledWith('A101');
      expect(mockMeterReadingRepository.findOne).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith('existing-reading-id', dto, 'user-id');
      expect(result).toEqual({
        id: 'existing-reading-id',
        ...dto,
        memberId: 'member-id',
      });
    });

    it('should throw BadRequestException if current reading is less than previous reading', async () => {
      const dto = {
        flatNo: 'A101',
        currentReading: 100,
        previousReading: 150,
        readingDate: '2026-06-15',
      };
      const mockMember = { id: 'member-id', flatNo: 'A101' };
      mockMembersService.findByFlatNo.mockResolvedValue(mockMember);

      await expect(service.create(dto, 'user-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update the meter reading and the corresponding IndividualExpense if it exists', async () => {
      const readingId = 'reading-id';
      const updateDto = {
        flatNo: 'A101',
        currentReading: 160,
        previousReading: 100,
        readingDate: '2026-06-15',
      };
      
      const mockMember = { id: 'member-id', flatNo: 'A101' };
      const updatedReading = { id: readingId, ...updateDto, memberId: 'member-id' };
      
      mockMembersService.findByFlatNo.mockResolvedValue(mockMember);
      mockMeterReadingRepository.update.mockResolvedValue(undefined);
      
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedReading as any);
      
      const mockExpense = { id: 'expense-id', flatNo: 'A101', totalExpense: 100 };
      mockIndividualExpenseRepository.findOne.mockResolvedValue(mockExpense);
      mockIndividualExpenseRepository.update.mockResolvedValue(undefined);
      
      mockExpensesService.getOverview.mockResolvedValue({ oneLiterCharge: 2.5 });

      const result = await service.update(readingId, updateDto, 'user-id');

      expect(mockMeterReadingRepository.update).toHaveBeenCalledWith(readingId, {
        ...updateDto,
        memberId: 'member-id',
        updatedBy: 'user-id',
      });
      expect(mockIndividualExpenseRepository.findOne).toHaveBeenCalled();
      expect(mockExpensesService.getOverview).toHaveBeenCalledWith('2026-06');
      expect(mockIndividualExpenseRepository.update).toHaveBeenCalledWith('expense-id', {
        meterReadingTotal: 60,
        ratePerUnit: 2.5,
        totalExpense: 150,
        updatedBy: 'user-id',
      });
      expect(result).toEqual(updatedReading);
    });

    it('should update the meter reading but not IndividualExpense if none exists', async () => {
      const readingId = 'reading-id';
      const updateDto = {
        flatNo: 'A101',
        currentReading: 160,
        previousReading: 100,
        readingDate: '2026-06-15',
      };
      
      const mockMember = { id: 'member-id', flatNo: 'A101' };
      const updatedReading = { id: readingId, ...updateDto, memberId: 'member-id' };
      
      mockMembersService.findByFlatNo.mockResolvedValue(mockMember);
      mockMeterReadingRepository.update.mockResolvedValue(undefined);
      
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedReading as any);
      mockIndividualExpenseRepository.findOne.mockResolvedValue(null);

      const result = await service.update(readingId, updateDto, 'user-id');

      expect(mockMeterReadingRepository.update).toHaveBeenCalledWith(readingId, {
        ...updateDto,
        memberId: 'member-id',
        updatedBy: 'user-id',
      });
      expect(mockIndividualExpenseRepository.findOne).toHaveBeenCalled();
      expect(mockIndividualExpenseRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(updatedReading);
    });
  });
});

