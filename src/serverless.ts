import 'reflect-metadata';
import 'pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app: any;

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      const nestApp = await NestFactory.create(AppModule);
      nestApp.setGlobalPrefix('api');
      nestApp.enableCors();
      await nestApp.init();
      app = nestApp.getHttpAdapter().getInstance();
    }
    return app(req, res);
  } catch (error: any) {
    console.error('NestJS Initialization Error:', error);
    res.status(500).json({
      error: 'NestJS Boot Crash',
      message: error?.message,
      stack: error?.stack,
    });
  }
}
