import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME || 'postgres.dvjqrkbqvbmsglwtktvc', // 'postgres', // postgres.dvjqrkbqvbmsglwtktvc
  password: process.env.DB_PASSWORD || 'Avinassh6@supabase',  // '12345', //[password]
  database: process.env.DB_NAME || 'postgres', //practice //postgres    //nestjs-vercel-db
  synchronize: true, // Set to false in production
  logging: true,
};

export const mongooseConfig = {
  uri: 'mongodb+srv://avinashkolluru1666_db_user:VXWJy2QSw02Ykg0T@myfirstcluster.d6ixivc.mongodb.net/?appName=myfirstCluster',
};

export const jwtConstants = {
  secret:
    'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};

export const DATABASE_URL = 'postgresql://postgres.dvjqrkbqvbmsglwtktvc:Avinassh6@supabase@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

//postgresql://postgres.dvjqrkbqvbmsglwtktvc:Avinassh6@supabase@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres


// host:
// aws-1-ap-northeast-1.pooler.supabase.com

// port:
// 5432

// database:
// postgres

// user:
// postgres.dvjqrkbqvbmsglwtktvc

