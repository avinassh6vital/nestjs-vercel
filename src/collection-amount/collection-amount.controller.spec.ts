import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAmountController } from './collection-amount.controller';
import { CollectionAmountService } from './collection-amount.service';

describe('CollectionAmountController', () => {
  let controller: CollectionAmountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionAmountController],
      providers: [CollectionAmountService],
    }).compile();

    controller = module.get<CollectionAmountController>(CollectionAmountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
