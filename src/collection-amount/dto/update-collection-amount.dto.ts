import { PartialType } from '@nestjs/mapped-types';
import { CreateCollectionAmountDto } from './create-collection-amount.dto';

export class UpdateCollectionAmountDto extends PartialType(CreateCollectionAmountDto) {}
