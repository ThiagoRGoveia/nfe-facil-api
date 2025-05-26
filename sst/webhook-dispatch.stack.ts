// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { getConfig } from './api.stack';

export function WebhookDispatchStack() {
  // Create a dead letter queue for failed webhook deliveries
  const deadLetterQueue = new sst.aws.Queue('WebhookDispatchDLQ', {
    fifo: false,
  });

  const webhookDispatchQueue = new sst.aws.Queue('WebhookDispatchQueue', {
    fifo: false,
    visibilityTimeout: '60 seconds',
    dlq: {
      queue: deadLetterQueue.arn,
      retry: 3,
    },
  });

  webhookDispatchQueue.subscribe(
    {
      ...getConfig('index.handler', 'dist/apps/webhook-dispatch-job'),
      timeout: '60 seconds',
    },
    {
      batch: {
        size: 50,
        partialResponses: true,
        window: '10 seconds',
      },
    },
  );

  return {
    webhookDispatchQueue,
    deadLetterQueue,
  };
}
