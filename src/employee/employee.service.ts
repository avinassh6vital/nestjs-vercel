import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee> 
  ) {}

  create(createEmployeeDto: CreateEmployeeDto) {
    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  findAll() {
    return this.employeeRepository.find();
    // return `This action returns all employee`;
  }

  findOne(id: string) {
    return this.employeeRepository.findOne({ where: { id } });
    // return `This action returns a #${id} employee`;
  }

  update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeRepository.update(id, updateEmployeeDto);
    // return `This action updates a #${id} employee`;
  }

  remove(id: string) {
    return this.employeeRepository.delete(id);
    // return `This action removes a #${id} employee`;
  }
}
