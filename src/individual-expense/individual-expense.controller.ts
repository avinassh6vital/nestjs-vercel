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
  UseGuards,
  Request,
} from '@nestjs/common';
import { IndividualExpenseService } from './individual-expense.service';
import { CreateIndividualExpenseDto } from './dto/create-individual-expense.dto';
import { UpdateIndividualExpenseDto } from './dto/update-individual-expense.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('individual-expense')
export class IndividualExpenseController {
  constructor(private readonly service: IndividualExpenseService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() createDto: CreateIndividualExpenseDto, @Request() req: any) {
    try {
      const userId = req.user?.sub;
      const data = await this.service.create(createDto, userId);
      return {
        message: 'Added successfully',
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
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

      const { page: _p, limit: _l, search: _s, sort: _so, ...filters } = queryParams || {};

      return await this.service.findAll(
        pageNum,
        limitNum,
        search || '',
        sort || '',
        filters,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
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
      const data = await this.service.findOne(uuid);
      if (!data) {
        throw new HttpException('Individual expense not found', HttpStatus.NOT_FOUND);
      }
      return data;
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Patch(':uuid')
  async update(
    @Param(
      'uuid',
      new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    uuid: string,
    @Body() updateDto: UpdateIndividualExpenseDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.sub;
      const data = await this.service.update(uuid, updateDto, userId);
      return {
        message: 'updated successfully',
        id: uuid,
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
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
      const result = await this.service.remove(uuid);
      return {
        message: 'deleted successfully',
        id: uuid,
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
