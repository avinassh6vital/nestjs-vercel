import { Module } from '@nestjs/common';
import { UsersDataService } from './users-data.service';

@Module({
  providers: [UsersDataService],
  exports: [UsersDataService],
})
export class UsersDataModule {}
