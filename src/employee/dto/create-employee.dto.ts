import { IsString, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsNumber()
  age: number;

  @IsString()
  gender: string;

  @IsString()
  designation: string;

  @IsString()
  department: string;

  @IsNumber()
  salary: number;
}
