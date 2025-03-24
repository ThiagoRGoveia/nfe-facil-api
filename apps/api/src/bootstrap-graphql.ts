import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { INestApplication } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload-minimal';

export interface BootstrapGraphQLOptions {
  rawBody?: boolean;
  graphqlUploadOptions?: {
    maxFileSize: number;
    maxFiles: number;
  };
}

export async function bootstrapGraphQL(options: BootstrapGraphQLOptions = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot({ apiType: 'graphql' }), {
    rawBody: options.rawBody ?? false,
  });

  app.useLogger(app.get(Logger));

  if (options.graphqlUploadOptions) {
    app.use(
      graphqlUploadExpress({
        maxFileSize: options.graphqlUploadOptions.maxFileSize,
        maxFiles: options.graphqlUploadOptions.maxFiles,
        environment: process.env.NODE_ENV === 'production' ? 'lambda' : undefined,
      }),
    );
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight'],
    credentials: true,
  });

  return app;
}
