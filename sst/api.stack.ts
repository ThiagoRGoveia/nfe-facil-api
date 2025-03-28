// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { FunctionArgs } from "../.sst/platform/src/components/aws/function";

function getConfig(handler: string, bundle: string) {
  return {
    handler,
    bundle,
    memory: '1024 MB',
    timeout: '900 seconds',
    permissions: [
      {
        actions: [
          'rds-db:connect',
          'rds:DescribeDBInstances',
          'rds:DescribeDBClusters'
        ],
        resources: ['*']
      },
      {
        actions: ['s3:*'],
        resources: ['*']
      },
      {
        actions: ['sqs:*'],
        resources: ['*']
      }
    ],
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      API_VERSION: process.env.API_VERSION || '1.0.0',
      DB_HOST: process.env.DB_HOST || '',
      DB_PORT: process.env.DB_PORT || '',
      DB_USERNAME: process.env.DB_USERNAME || '',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
      DB_DATABASE: process.env.DB_DATABASE || '',
      AWS_ACCESS_KEY_ID_ENV: process.env.AWS_ACCESS_KEY_ID_ENV || '',
      AWS_SECRET_ACCESS_KEY_ENV: process.env.AWS_SECRET_ACCESS_KEY_ENV || '',
      AWS_REGION_ENV: process.env.AWS_REGION_ENV || '',
      DOCUMENT_BUCKET_NAME: process.env.DOCUMENT_BUCKET_NAME || '',
      DOCUMENT_PROCESSING_QUEUE: process.env.DOCUMENT_PROCESSING_QUEUE || '',
      TOGETHER_API_KEY: process.env.TOGETHER_API_KEY || '',
      NFSE_TEMPLATE_ID: process.env.NFSE_TEMPLATE_ID || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      STRIPE_WEBHOOK_SIGNATURE: process.env.STRIPE_WEBHOOK_SIGNATURE || '',
      AUTH_DOMAIN: process.env.AUTH_DOMAIN || '',
      AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID || '',
      AUTH_CLIENT_SECRET: process.env.AUTH_CLIENT_SECRET || '',
      AUTH_ISSUER_URL: process.env.AUTH_ISSUER_URL || '',
      AUTH_AUDIENCE: process.env.AUTH_AUDIENCE || '',
    }
  } as FunctionArgs
}

export function ApiStack() {
  // Create the HTTP API Gateway
  const api = new sst.aws.ApiGatewayV2('Api', {
    cors: {
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight'],
      maxAge: '1 day',
    },
    accessLog: {
      retention: '1 day',
    },
  });

  // Add GraphQL specific routes
  api.route('POST /graphql', {
    ...getConfig('index.handler', 'dist/apps/api'),
  
  });

  // Add catch-all route for other endpoints using the public API lambda
  api.route('ANY /{proxy+}', {
    ...getConfig('index.handler', 'dist/apps/public-api'),
  });

  return {
    api,
  };
}
