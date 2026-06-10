import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCollectionAmountDto } from './dto/create-collection-amount.dto';
import { UpdateCollectionAmountDto } from './dto/update-collection-amount.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionAmount } from './entities/collection-amount.entity';
import { Repository } from 'typeorm';
import { buildQueryOptions } from '../utils/filter.util';
import { MembersService } from '../members/members.service';

@Injectable()
export class CollectionAmountService {

  constructor(
    @InjectRepository(CollectionAmount)
    private collectionAmountRepository: Repository<CollectionAmount>,
    private readonly membersService: MembersService,
  ) {}
  
  async create(createCollectionAmountDto: CreateCollectionAmountDto) {
    if (createCollectionAmountDto.memberId) {
      const member = await this.membersService.findOne(createCollectionAmountDto.memberId);
      if (!member) {
        throw new NotFoundException(`Member with ID ${createCollectionAmountDto.memberId} not found`);
      }
    }
    const collectionAmount = this.collectionAmountRepository.create(
      createCollectionAmountDto,
    );
    const saved = await this.collectionAmountRepository.save(collectionAmount);
    saved.amount = Number(saved.amount);
    return saved;
  }

  async findAll(
    page = 1,
    limit = 10,
    searchTerm = '',
    sort = '',
    filters: Record<string, any> = {},
  ) {
    const searchFields = ['paymentMethod', 'description'];
    const queryOptions = buildQueryOptions<CollectionAmount>(
      page,
      limit,
      searchTerm,
      sort,
      filters,
      searchFields,
    );
    queryOptions.relations = ['member'];

    const [collectionAmounts, total] = await this.collectionAmountRepository.findAndCount(queryOptions);
    
    const mappedCollectionAmounts = collectionAmounts.map(item => ({
      ...item,
      amount: Number(item.amount),
    }));

    const totalAmount = mappedCollectionAmounts.reduce((sum, item) => sum + item.amount, 0);

    return {
      collectionAmounts: mappedCollectionAmounts,
      total,
      page,
      limit,
      totalAmount,
    };
  }

  async findOne(id: string) {
    const collectionAmount = await this.collectionAmountRepository.findOne({
      where: { id },
      relations: ['member'],
    });
    if (collectionAmount) {
      collectionAmount.amount = Number(collectionAmount.amount);
    }
    return collectionAmount;
  }

  async update(id: string, updateCollectionAmountDto: UpdateCollectionAmountDto) {
    if (updateCollectionAmountDto.memberId) {
      const member = await this.membersService.findOne(updateCollectionAmountDto.memberId);
      if (!member) {
        throw new NotFoundException(`Member with ID ${updateCollectionAmountDto.memberId} not found`);
      }
    }
    await this.collectionAmountRepository.update(id, updateCollectionAmountDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const collectionAmount = await this.findOne(id);
    if (collectionAmount) {
      await this.collectionAmountRepository.remove(collectionAmount);
    }
    return { deleted: true };
  }
}


