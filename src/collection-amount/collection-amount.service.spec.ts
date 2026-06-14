import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAmountService } from './collection-amount.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CollectionAmount } from './entities/collection-amount.entity';
import { MembersService } from '../members/members.service';

describe('CollectionAmountService', () => {
  let service: CollectionAmountService;

  const mockCollectionAmountRepository = {
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
        CollectionAmountService,
        {
          provide: getRepositoryToken(CollectionAmount),
          useValue: mockCollectionAmountRepository,
        },
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
      ],
    }).compile();

    service = module.get<CollectionAmountService>(CollectionAmountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

