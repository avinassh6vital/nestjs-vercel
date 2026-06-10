import { IsNotEmpty, IsNumber, Min, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateMeterReadingDto {

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  flatNo: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  currentReading: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  previousReading?: number;

  @IsDateString()
  readingDate: string; // YYYY-MM-DD

  @IsOptional()
  @MaxLength(200)
  notes?: string;
}
