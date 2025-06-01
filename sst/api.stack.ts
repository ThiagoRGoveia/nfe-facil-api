// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { FunctionArgs } from '../.sst/platform/src/components/aws/function';

export function getConfig(handler: string, bundle: string) {
  return {
    handler,
    bundle,
    memory: '1024 MB',
    timeout: '900 seconds',
    vpc: {
      securityGroups: ['sg-01e531d730fbffe95'], // inb-vpc
      privateSubnets: [
        'subnet-03e9f1f95db6bde9a', // us-east-1e
      ],
    },
    permissions: [
      {
        actions: ['rds-db:connect', 'rds:DescribeDBInstances', 'rds:DescribeDBClusters'],
        resources: ['*'],
      },
      {
        actions: ['s3:*'],
        resources: ['*'],
      },
      {
        actions: ['sqs:*'],
        resources: ['*'],
      },
    ],
    policies: ['arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'],
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
      OUTPUT_CONSOLIDATION_QUEUE: process.env.OUTPUT_CONSOLIDATION_QUEUE || '',
      WEBHOOK_DISPATCH_QUEUE: process.env.WEBHOOK_DISPATCH_QUEUE || '',
      CREDIT_SPENDING_QUEUE: process.env.CREDIT_SPENDING_QUEUE || '',
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
      PROXY_URL: process.env.PROXY_URL || '',
      PROXY_PORT: process.env.PROXY_PORT || '',
    },
  } as FunctionArgs;
}

export function getContactFormConfig(handler: string, bundle: string) {
  return {
    handler,
    bundle,
    memory: '512 MB', // Less memory since it's a simple API
    timeout: '60 seconds',
    permissions: [
      {
        // Only SES permissions
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      },
    ],
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      API_VERSION: process.env.API_VERSION || '1.0.0',
      // Only AWS env vars needed for SES
      AWS_ACCESS_KEY_ID_ENV: process.env.AWS_ACCESS_KEY_ID_ENV || '',
      AWS_SECRET_ACCESS_KEY_ENV: process.env.AWS_SECRET_ACCESS_KEY_ENV || '',
      AWS_REGION_ENV: process.env.AWS_REGION_ENV || '',
      // Contact form specific env
      CONTACT_EMAIL: process.env.CONTACT_EMAIL || '',
    },
  } as FunctionArgs;
}

export function ApiStack() {
  // Create the HTTP API Gateway
  const api = new sst.aws.ApiGatewayV2(`Api-production`, {
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

  api.route('POST /contact-form', {
    ...getContactFormConfig('index.handler', 'dist/apps/contact-form-api'),
  });

  // Add catch-all route for other endpoints using the public API lambda
  api.route('ANY /{proxy+}', {
    ...getConfig('index.handler', 'dist/apps/public-api'),
  });

  return {
    api,
  };
}
