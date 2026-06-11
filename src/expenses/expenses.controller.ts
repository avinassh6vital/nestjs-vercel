import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Request() req: any) {
    const userId = req.user?.sub;
    return this.expensesService.create(createExpenseDto, userId);
  }

  //@UseGuards(AuthGuard)
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

    return this.expensesService.findAll(pageNum, limitNum, search || '', sort || '', filters);
  }
  @UseGuards(AuthGuard)
  @Get('overview')
  getOverview(@Query('month') month?: string) {
    return this.expensesService.getOverview(month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @Request() req: any) {
    const userId = req.user?.sub;
    return this.expensesService.update(id, updateExpenseDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}

