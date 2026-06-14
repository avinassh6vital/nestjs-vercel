import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAmountController } from './collection-amount.controller';
import { CollectionAmountService } from './collection-amount.service';

describe('CollectionAmountController', () => {
  let controller: CollectionAmountController;

  const mockCollectionAmountService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionAmountController],
      providers: [
        {
          provide: CollectionAmountService,
          useValue: mockCollectionAmountService,
        },
      ],
    }).compile();

    controller = module.get<CollectionAmountController>(CollectionAmountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

