import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query() queryParams?: Record<string, any>,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Separate pagination/sorting params from other filter params
    const { page: _p, limit: _l, search: _s, sort: _so, ...filters } = queryParams || {};

    return this.collectionAmountService.findAll(pageNum, limitNum, search || '', sort || '', filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionAmountService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCollectionAmountDto: UpdateCollectionAmountDto) {
    return this.collectionAmountService.update(id, updateCollectionAmountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectionAmountService.remove(id);
  }
}

