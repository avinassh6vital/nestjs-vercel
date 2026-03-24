import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':uuid')
  //findOne(@Param('id') id: string) {
  async findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.employeeService.findOne(uuid);
  }

  @Patch(':uuid')
  async update(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    await this.employeeService.update(uuid, updateEmployeeDto);
    return {
      message: 'updated successfully',
      id: uuid,
      Body: updateEmployeeDto,
    };
  }

  @Delete(':uuid')
  async remove(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    await this.employeeService.remove(uuid);
    return { message: 'deleted successfully', id: uuid };
  }
}
