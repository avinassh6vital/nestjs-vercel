import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';

describe('MembersService', () => {
  let service: MembersService;

  const mockMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getRepositoryToken(Member),
          useValue: mockMemberRepository,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

