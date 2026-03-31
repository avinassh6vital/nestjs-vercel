import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';



async function bootstrapServer() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}

let cachedServer: any;
async function bootstrapVercel() {
  // Force Vercel to bundle TypeORM's Postgres driver without crashing at the top level
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
  const pg = require('pg');

  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });
    app.setGlobalPrefix('api');
    app.enableCors();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const server = await bootstrapVercel();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return server(req, res);
  } catch (error: any) {
    console.error('NestJS Serverless Vercel Initialization Error: ', error);
    // Send the detailed error back to the browser so we can see exactly what crashed!
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    res.statusCode = 500;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.setHeader('Content-Type', 'text/plain');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.end(
      'NestJS Initialization Error: ' +
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (error?.message || String(error)) +
        '\n\nStack: ' +
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (error?.stack || ''),
    );
  }
}

if (!process.env.VERCEL) {
  bootstrapServer().catch((err) => {
    console.error(err);
  });
}
