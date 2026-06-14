import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAmountController } from './collection-amount.controller';
import { CollectionAmountService } from './collection-amount.service';
import { JwtService } from '@nestjs/jwt';

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
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CollectionAmountController>(CollectionAmountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});


