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
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // SequelizeModule.forRoot({
    //   ...databaseConfig,
    //   models: [User],
    //   autoLoadModels: true,
    //   synchronize: true,
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      //...databaseConfig,
      type: 'postgres',
      //url: process.env.DATABASE_URL,
      url: 'postgresql://postgres:Avinassh6@supabase@db.dvjqrkbqvbmsglwtktvc.supabase.co:5432/postgres',
      //url: 'postgresql://postgres.dvjqrkbqvbmsglwtktvc:Avinassh6@supabase@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
      //process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
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
