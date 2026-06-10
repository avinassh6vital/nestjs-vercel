import { Injectable } from '@nestjs/common';
import { CreateCollectionAmountDto } from './dto/create-collection-amount.dto';
import { UpdateCollectionAmountDto } from './dto/update-collection-amount.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionAmount } from './entities/collection-amount.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CollectionAmountService {

  constructor(
      @InjectRepository(CollectionAmount)
      private collectionAmountRepository: Repository<CollectionAmount>,
    ) {}
  
  create(createCollectionAmountDto: CreateCollectionAmountDto) {
    const collectionAmount = this.collectionAmountRepository.create(
      createCollectionAmountDto,
    );
    return this.collectionAmountRepository.save(collectionAmount);
  }

  // findAll() {
  //   return `This action returns all collectionAmount`;
  // }

  async findAll() {
    const collectionAmounts = await this.collectionAmountRepository.find();
    const totalAmount = collectionAmounts.reduce((sum, item) => sum + item.amount, 0);
    return { collectionAmounts, totalAmount };
  }

  findOne(id: number) {
    return `This action returns a #${id} collectionAmount`;
  }

  update(id: number, updateCollectionAmountDto: UpdateCollectionAmountDto) {
    return `This action updates a #${id} collectionAmount`;
  }

  remove(id: number) {
    return `This action removes a #${id} collectionAmount`;
  }
}
