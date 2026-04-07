import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
//import { SequelizeModule } from '@nestjs/sequelize';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeModule } from './employee/employee.module';
import { User } from './users/entities/user.entity';
import { Employee } from './employee/entities/employee.entity';
import { AuthModule } from './auth/auth.module';
import { UsersDataModule } from './users-data/users-data.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { databaseConfig } from './database/config';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // SequelizeModule.forRoot({
    //   ...databaseConfig,
    //   models: [User],
    //   autoLoadModels: true,
    //   synchronize: true,
    // }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      //...databaseConfig,
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // for render
      },
      synchronize: true,
      entities: [User, Employee],
      //entities: [__dirname + '/entity/*{.js,.ts}'],
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
