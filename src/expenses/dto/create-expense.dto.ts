// export class CreateExpenseDto {}

import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { ExpenseType, WaterSource } from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsEnum(ExpenseType)
  type: ExpenseType;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => o.type === ExpenseType.WATER)
  @IsEnum(WaterSource)
  waterSource?: WaterSource;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => o.type === ExpenseType.OTHER)
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

