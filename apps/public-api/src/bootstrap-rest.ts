import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../api/src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { INestApplication } from '@nestjs/common';

export interface BootstrapRestOptions {
  rawBody?: boolean;
}

export async function bootstrapRest(options: BootstrapRestOptions = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot({ apiType: 'rest' }), {
    rawBody: options.rawBody ?? false,
  });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  return app;
}
