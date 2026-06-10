import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async create(createMemberDto: CreateMemberDto) {
    if (createMemberDto.active !== false) {
      // active is true or undefined (which defaults to true)
      const existingActiveMember = await this.memberRepository.findOne({
        where: { flatNo: createMemberDto.flatNo, active: true },
      });
      if (existingActiveMember) {
        throw new BadRequestException(
          `An active member already exists for flat number ${createMemberDto.flatNo}`,
        );
      }
    }
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
      this.memberRepository,
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

  findByFlatNo(flatNo: number) {
    return this.memberRepository.findOne({
      where: { flatNo, active: true },
    });
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    const currentMember = await this.findOne(id);
    if (!currentMember) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const willBeActive =
      updateMemberDto.active !== undefined
        ? updateMemberDto.active
        : currentMember.active;
    const targetFlatNo =
      updateMemberDto.flatNo !== undefined
        ? updateMemberDto.flatNo
        : currentMember.flatNo;

    if (willBeActive) {
      const existingActiveMember = await this.memberRepository.findOne({
        where: { flatNo: targetFlatNo, active: true },
      });
      if (existingActiveMember && existingActiveMember.id !== id) {
        throw new BadRequestException(
          `An active member already exists for flat number ${targetFlatNo}`,
        );
      }
    }

    await this.memberRepository.update(id, updateMemberDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.memberRepository.delete({ id });
  }
}


