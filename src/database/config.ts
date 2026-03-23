import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '12345', //[password]
  database: process.env.DB_NAME || 'practice', //practice //postgres
  synchronize: true, // Set to false in production
  logging: true,
};

export const mongooseConfig = {
  uri: 'mongodb+srv://avinashkolluru1666_db_user:VXWJy2QSw02Ykg0T@myfirstcluster.d6ixivc.mongodb.net/?appName=myfirstCluster',
};
