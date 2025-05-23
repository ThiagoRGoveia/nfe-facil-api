declare const module: any;

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

let server: Handler;

// Function to create a NestJS application with common configurations
async function createApp() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  return app;
}

// Function to create and start a local development server
async function startDevServer() {
  const app = await createApp();

  await app.listen(process.env.CONTACT_FORM_PORT ?? 4002);
  console.log(`Contact Form API is running on: ${await app.getUrl()}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

// Function to create a serverless handler
async function createServerlessHandler(): Promise<Handler> {
  const app = await createApp();

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

// Determine execution mode based on NODE_ENV
const isServerless = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'uat';

// For local development, start the server immediately
if (!isServerless) {
  startDevServer().catch((err) => {
    console.error('Error starting Contact Form API development server:', err);
    process.exit(1);
  });
}

// For serverless environments, export the handler
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  server = server ?? (await createServerlessHandler());
  return server(event, context, callback);
};
