import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CollectionAmountService } from './collection-amount.service';
import { CreateCollectionAmountDto } from './dto/create-collection-amount.dto';
import { UpdateCollectionAmountDto } from './dto/update-collection-amount.dto';

@Controller('collection-amount')
export class CollectionAmountController {
  constructor(private readonly collectionAmountService: CollectionAmountService) {}

  @Post()
  create(@Body() createCollectionAmountDto: CreateCollectionAmountDto) {
    return this.collectionAmountService.create(createCollectionAmountDto);
  }

  @Get()
  findAll() {
    return this.collectionAmountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionAmountService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCollectionAmountDto: UpdateCollectionAmountDto) {
    return this.collectionAmountService.update(+id, updateCollectionAmountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectionAmountService.remove(+id);
  }
}
