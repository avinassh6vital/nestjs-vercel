import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { CollectionAmountService } from './collection-amount.service';
import { CreateCollectionAmountDto } from './dto/create-collection-amount.dto';
import { UpdateCollectionAmountDto } from './dto/update-collection-amount.dto';

@Controller('collection-amount')
export class CollectionAmountController {
  constructor(private readonly collectionAmountService: CollectionAmountService) {}

  @Post()
  async create(@Body() createCollectionAmountDto: CreateCollectionAmountDto) {
    try {
      const data = await this.collectionAmountService.create(createCollectionAmountDto);
      return {
        message: 'Added successfully',
        data,
      };
    } catch (error) {
      throw new HttpException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.message || 'Internal server error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query() queryParams?: Record<string, any>,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      // Separate pagination/sorting params from other filter params
      const { page: _p, limit: _l, search: _s, sort: _so, ...filters } = queryParams || {};

      return await this.collectionAmountService.findAll(pageNum, limitNum, search || '', sort || '', filters);
    } catch (error) {
      throw new HttpException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.message || 'Internal server error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':uuid')
  async findOne(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    uuid: string,
  ) {
    try {
      const data = await this.collectionAmountService.findOne(uuid);
      if (!data) {
        throw new HttpException('Collection amount not found', HttpStatus.NOT_FOUND);
      }
      return data;
    } catch (error) {
      throw new HttpException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.message || 'Internal server error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':uuid')
  async update(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    uuid: string,
    @Body() updateCollectionAmountDto: UpdateCollectionAmountDto,
  ) {
    try {
      const data = await this.collectionAmountService.update(uuid, updateCollectionAmountDto);
      return {
        message: 'updated successfully',
        id: uuid,
        data,
      };
    } catch (error) {
      throw new HttpException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.message || 'Internal server error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':uuid')
  async remove(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    uuid: string,
  ) {
    try {
      const result = await this.collectionAmountService.remove(uuid);
      return {
        message: 'deleted successfully',
        id: uuid,
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.message || 'Internal server error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}


