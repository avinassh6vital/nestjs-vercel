import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
//import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './database/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeModule } from './employee/employee.module';
import { User } from './users/entities/user.entity';
import { Employee } from './employee/entities/employee.entity';
import { AuthModule } from './auth/auth.module';
import { UsersDataModule } from './users-data/users-data.module';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // SequelizeModule.forRoot({
    //   ...databaseConfig,
    //   models: [User],
    //   autoLoadModels: true,
    //   synchronize: true,
    // }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [User, Employee],
     // entities: [__dirname + '/entity/*{.js,.ts}'],
    }),
    UsersModule,
    EmployeeModule,
    AuthModule,
    UsersDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
