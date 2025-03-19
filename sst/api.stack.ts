// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

export function ApiStack() {
  // Create the HTTP API Gateway
  const api = new sst.aws.ApiGatewayV2('Api', {
    cors: {
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight'],
      allowCredentials: true,
      maxAge: '1 day',
    },
    accessLog: {
      retention: '1 day',
    },
    domain: process.env.DOMAIN,
    transform: {
      route: {
        handler: (args) => {
          // Set default configuration for all routes
          args.memory ??= '1024 MB';
          args.timeout ??= '29 seconds';
          args.environment ??= {
            NODE_ENV: process.env.NODE_ENV || 'development',
            DB_HOST: process.env.DB_HOST || '',
            DB_PORT: process.env.DB_PORT || '',
            DB_USERNAME: process.env.DB_USERNAME || '',
            DB_PASSWORD: process.env.DB_PASSWORD || '',
            DB_DATABASE: process.env.DB_DATABASE || '',
          };
        },
      },
    },
  });

  // Add the catch-all route for the API
  api.route('ANY /{proxy+}', {
    handler: 'main.handler',
    bundle: 'dist/apps/api',
  });

  return {
    api,
  };
}
