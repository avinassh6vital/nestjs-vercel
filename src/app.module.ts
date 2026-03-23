import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './database/config';
import { User } from './users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

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
      entities: [User],
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
