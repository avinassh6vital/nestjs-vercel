import { Test, TestingModule } from '@nestjs/testing';
import { IndividualExpenseController } from './individual-expense.controller';
import { IndividualExpenseService } from './individual-expense.service';
import { JwtService } from '@nestjs/jwt';

describe('IndividualExpenseController', () => {
  let controller: IndividualExpenseController;

  const mockIndividualExpenseService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndividualExpenseController],
      providers: [
        {
          provide: IndividualExpenseService,
          useValue: mockIndividualExpenseService,
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

    controller = module.get<IndividualExpenseController>(IndividualExpenseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

