import { IsNotEmpty, IsNumber, Min, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';

export class CreateIndividualExpenseDto {
  @IsNotEmpty()
  @IsString()
  flatNo: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ratePerUnit?: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
