import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { CollectionAmount } from '../collection-amount/entities/collection-amount.entity';
import { IndividualExpense } from '../individual-expense/entities/individual-expense.entity';
import { Expense } from '../expenses/entities/expense.entity';

describe('MembersService', () => {
  let service: MembersService;

  const mockMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockCollectionAmountRepository = {
    find: jest.fn(),
  };

  const mockIndividualExpenseRepository = {
    find: jest.fn(),
  };

  const mockExpenseRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getRepositoryToken(Member),
          useValue: mockMemberRepository,
        },
        {
          provide: getRepositoryToken(CollectionAmount),
          useValue: mockCollectionAmountRepository,
        },
        {
          provide: getRepositoryToken(IndividualExpense),
          useValue: mockIndividualExpenseRepository,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});


