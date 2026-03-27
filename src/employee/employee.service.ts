import { Injectable, Logger } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Repository } from 'typeorm';
import { buildQueryOptions } from '../utils/filter.util';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private readonly logger = new Logger(EmployeeService.name),
  ) {}

  create(createEmployeeDto: CreateEmployeeDto) {
    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  // async findAll(
  //   page = 1,
  //   limit = 10,
  //   searchTerm = '',
  //   sort = '',
  //   filters: Record<string, any> = {},
  // ) {
  //   const skip = (page - 1) * limit;

  //   const order: Record<string, 'ASC' | 'DESC'> = {};
  //   if (sort) {
  //     // e.g., sort="name:ASC,createdAt:DESC"
  //     const sortFields = sort.split(',');
  //     sortFields.forEach((field) => {
  //       const [key, direction] = field.split(':');
  //       order[key] = direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  //     });
  //   } else {
  //     order.createdAt = 'DESC'; // Important: Always order results for predictable pagination.
  //   }

  //   const where: Record<string, any> = {};
  //   if (filters && Object.keys(filters).length > 0) {
  //     const likeFields = ['name', 'gender', 'designation', 'department'];

  //     Object.keys(filters).forEach((key) => {
  //       const value = String(filters[key]);
  //       if (value) {
  //         if (
  //           key === 'createdAt' ||
  //           key === 'updatedAt' ||
  //           key.toLowerCase().includes('date')
  //         ) {
  //           const startOfDay = new Date(value);
  //           startOfDay.setHours(0, 0, 0, 0);
  //           const endOfDay = new Date(value);
  //           endOfDay.setHours(23, 59, 59, 999);
  //           if (!isNaN(startOfDay.getTime())) {
  //             where[key] = Between(startOfDay, endOfDay);
  //           }
  //         } else if (likeFields.includes(key)) {
  //           where[key] = Like(`%${value}%`);
  //         } else {
  //           where[key] = filters[key];
  //         }
  //       }
  //     });
  //   }

  //   const findOptions: FindManyOptions<any> = {
  //     take: limit,
  //     skip: skip,
  //     order,
  //   };

  //   if (searchTerm) {
  //     // Add search condition. Using `Like` for partial matching in PostgreSQL.
  //     findOptions.where = [{ ...where, name: Like(`%${searchTerm}%`) }];
  //   } else if (Object.keys(where).length > 0) {
  //     findOptions.where = where;
  //   }
  //   const [data, total] =
  //     await this.employeeRepository.findAndCount(findOptions);
  //   return {
  //     data,
  //     total,
  //     page,
  //     limit,
  //   };
  // }

  async findAll(
    page = 1,
    limit = 10,
    searchTerm = '',
    sort = '',
    filters: Record<string, any> = {},
  ) {
    const findOptions = buildQueryOptions<Employee>(
      page,
      limit,
      searchTerm,
      sort,
      filters,
    );
    this.logger.log('Doing something with timestamp here ->', findOptions);
    const [data, total] =
      await this.employeeRepository.findAndCount(findOptions);
    return {
      data,
      total,
      page,
      limit,
    };
  }

  findOne(id: string) {
    return this.employeeRepository.findOne({ where: { id } });
  }

  update(uuid: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = this.employeeRepository.update(uuid, updateEmployeeDto);
    return employee;
  }

  async remove(id: string) {
    await this.employeeRepository.delete({ id });
  }
}
