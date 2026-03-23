import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './database/config';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    SequelizeModule.forRoot({
      ...databaseConfig,
      models: [User],
      autoLoadModels: true,
      synchronize: true,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
