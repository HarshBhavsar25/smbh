// Polyfill crypto for Node.js < 19 (Railway uses Node 18)
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://shreemauliboyshostel.vercel.app',
      'https://shreemauliboyshostel.com',
      'https://www.shreemauliboyshostel.com',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  });
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
