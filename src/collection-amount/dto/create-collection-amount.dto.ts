import { IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCollectionAmountDto {
  @IsNumber()
  flatNo: number;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
