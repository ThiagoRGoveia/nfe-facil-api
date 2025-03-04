// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

export function ApiStack() {
  // Create the HTTP API Gateway
  const api = new sst.aws.ApiGatewayV2('Api', {
    cors: true,
    accessLog: {
      retention: '1 month',
    },
    // domain: process.env.DOMAIN
    //   ? {
    //       name: process.env.DOMAIN,
    //       dns: sst.cloudflare.dns(),
    //     }
    //   : undefined,
  });

  // Add the catch-all route
  api.route('ANY /{proxy+}', {
    handler: 'dist/apps/api/main.handler',
    runtime: 'nodejs20.x',
    timeout: '29 seconds',
    memory: '1024 MB',
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      DB_HOST: process.env.DB_HOST || '',
      DB_PORT: process.env.DB_PORT || '',
      DB_USERNAME: process.env.DB_USERNAME || '',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
      DB_DATABASE: process.env.DB_DATABASE || '',
    },
  });

  return {
    api,
  };
}
