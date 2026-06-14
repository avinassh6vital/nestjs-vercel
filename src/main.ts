import "reflect-metadata";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  //await app.listen(process.env.PORT ?? 3000);
  //Listen on all network interfaces
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
} 
void bootstrap();
₹