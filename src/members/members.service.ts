import { Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { Repository } from 'typeorm';
import { buildQueryOptions } from '../utils/filter.util';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  create(createMemberDto: CreateMemberDto) {
    const member = this.memberRepository.create(createMemberDto);
    return this.memberRepository.save(member);
  }

  async findAll(
    page = 1,
    limit = 10,
    searchTerm = '',
    sort = '',
    filters: Record<string, any> = {},
  ) {
    const findOptions = buildQueryOptions<Member>(
      page,
      limit,
      searchTerm,
      sort,
      filters,
      ['firstName', 'lastName', 'phoneNumber'],
    );
    findOptions.relations = ['meterReadings', 'collectionAmounts'];
    const [data, total] = await this.memberRepository.findAndCount(findOptions);
    return {
      data,
      total,
      page,
      limit,
    };
  }

  findOne(id: string) {
    return this.memberRepository.findOne({
      where: { id },
      relations: ['meterReadings', 'collectionAmounts'],
    });
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    await this.memberRepository.update(id, updateMemberDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.memberRepository.delete({ id });
  }
}

