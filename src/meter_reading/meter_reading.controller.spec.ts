import { Test, TestingModule } from '@nestjs/testing';
import { MeterReadingController } from './meter_reading.controller';
import { MeterReadingService } from './meter_reading.service';

describe('MeterReadingController', () => {
  let controller: MeterReadingController;

  const mockMeterReadingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeterReadingController],
      providers: [
        {
          provide: MeterReadingService,
          useValue: mockMeterReadingService,
        },
      ],
    }).compile();

    controller = module.get<MeterReadingController>(MeterReadingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

