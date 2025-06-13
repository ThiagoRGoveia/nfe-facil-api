// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { getConfig } from './api.stack';

export function CreditSpendingStack() {
  const deadLetterQueue = new sst.aws.Queue('CreditSpendingDLQ', {
    fifo: true,
  });

  const creditSpendingQueue = new sst.aws.Queue('CreditSpendingQueue', {
    fifo: true,
    visibilityTimeout: '30 seconds',
    dlq: {
      queue: deadLetterQueue.arn,
      retry: 3,
    },
  });

  creditSpendingQueue.subscribe(
    {
      ...getConfig('index.handler', 'dist/apps/credit-spending-job'),
      timeout: '350 seconds',
    },
    {
      batch: {
        size: 10,
        partialResponses: true,
      },
    },
  );

  return {
    creditSpendingQueue,
    deadLetterQueue,
  };
}
