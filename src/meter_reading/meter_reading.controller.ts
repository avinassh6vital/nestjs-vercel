import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MeterReadingService } from './meter_reading.service';
import { CreateMeterReadingDto } from './dto/create-meter_reading.dto';
import { UpdateMeterReadingDto } from './dto/update-meter_reading.dto';

@Controller('meter-reading')
export class MeterReadingController {
  constructor(private readonly meterReadingService: MeterReadingService) {}

  @Post()
  create(@Body() createMeterReadingDto: CreateMeterReadingDto) {
    return this.meterReadingService.create(createMeterReadingDto);
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

    return this.meterReadingService.findAll(pageNum, limitNum, search || '', sort || '', filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meterReadingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMeterReadingDto: UpdateMeterReadingDto) {
    return this.meterReadingService.update(id, updateMeterReadingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meterReadingService.remove(id);
  }
}

