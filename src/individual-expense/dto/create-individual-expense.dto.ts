import { IsNotEmpty, IsNumber, Min, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';

export class CreateIndividualExpenseDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  flatNo: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  ratePerUnit: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
