declare const module: any;

import { Handler } from 'aws-lambda';
import serverlessExpress from '@codegenie/serverless-express';
import { bootstrapGraphQL } from './bootstrap-graphql';

let server: Handler;

// Function to create and start a local development server
async function startDevServer() {
  const app = await bootstrapGraphQL({
    rawBody: true,
    graphqlUploadOptions: {
      maxFileSize: 1000000000,
      maxFiles: 10,
    },
  });

  await app.listen(process.env.GRAPHQL_PORT ?? 4000);
  console.log(`GraphQL API is running on: ${await app.getUrl()}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

// Function to create a serverless handler
async function createServerlessHandler(): Promise<Handler> {
  const app = await bootstrapGraphQL({
    graphqlUploadOptions: {
      maxFileSize: 10000000,
      maxFiles: 25,
    },
  });

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

// Determine execution mode based on NODE_ENV
const isServerless = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'uat';

// For local development, start the server immediately
if (!isServerless) {
  startDevServer().catch((err) => {
    console.error('Error starting GraphQL development server:', err);
    process.exit(1);
  });
}

// For serverless environments, export the handler
export const handler: Handler = async (event, context, callback) => {
  if (!server) {
    server = await createServerlessHandler();
  }
  return server(event, context, callback);
};
