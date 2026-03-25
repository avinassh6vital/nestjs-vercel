import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { FindManyOptions, Repository, Like } from 'typeorm';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  create(createEmployeeDto: CreateEmployeeDto) {
    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async findAll(page = 1, limit = 10, searchTerm = '') {
    const skip = (page - 1) * limit;
    const findOptions: FindManyOptions<any> = {
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' }, // Important: Always order results for predictable pagination.
    };
    if (searchTerm) {
      // Add search condition. Using `Like` for partial matching in PostgreSQL.
      // This example searches in a "title" and "description" field.
      // Adjust the fields based on your entity structure.
      findOptions.where = [
        { name: Like(`%${searchTerm}%`) }
      ];
    }
    const [data, total] = await this.employeeRepository.findAndCount(findOptions);
    return {
      data,
      total,
      page,
      limit,
    };
  }

  findOne(id: string) {
    return this.employeeRepository.findOne({ where: { id } });
    // return `This action returns a #${id} employee`;
  }

  update(uuid: string, updateEmployeeDto: UpdateEmployeeDto) {
   // return `This action updates a #${id} employee`;
   const employee = this.employeeRepository.update(uuid, updateEmployeeDto);
   return employee;
  }

  async remove(id: string) {
    await this.employeeRepository.delete({ id });
    //return `This action removes a #${id} employee`;
  }
}
