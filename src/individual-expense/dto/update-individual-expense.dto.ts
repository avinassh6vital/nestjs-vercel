import { PartialType } from '@nestjs/mapped-types';
import { CreateIndividualExpenseDto } from './create-individual-expense.dto';

export class UpdateIndividualExpenseDto extends PartialType(CreateIndividualExpenseDto) {}
