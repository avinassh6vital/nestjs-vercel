import { Test, TestingModule } from '@nestjs/testing';
import { CollectionAmountService } from './collection-amount.service';

describe('CollectionAmountService', () => {
  let service: CollectionAmountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionAmountService],
    }).compile();

    service = module.get<CollectionAmountService>(CollectionAmountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
