import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { Logger } from 'nestjs-pino';
import { INestApplication } from '@nestjs/common';

export interface BootstrapOptions {
  rawBody?: boolean;
  graphqlUploadOptions?: {
    maxFileSize: number;
    maxFiles: number;
  };
}

export async function bootstrap(options: BootstrapOptions = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    rawBody: options.rawBody ?? false,
  });

  app.useLogger(app.get(Logger));

  app.use(
    graphqlUploadExpress({
      maxFileSize: options.graphqlUploadOptions?.maxFileSize ?? 10000000,
      maxFiles: options.graphqlUploadOptions?.maxFiles ?? 10,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'graphql', method: RequestMethod.POST },
      { path: 'graphql', method: RequestMethod.GET },
    ],
  });

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight'],
    credentials: true,
  });

  return app;
}
