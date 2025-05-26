// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { getConfig } from './api.stack';

export function CreditSpendingStack() {
  const creditSpendingQueue = new sst.aws.Queue('CreditSpendingQueue', {
    fifo: true,
    visibilityTimeout: '30 seconds',
  });

  creditSpendingQueue.subscribe(
    {
      ...getConfig('index.handler', 'dist/apps/credit-spending-job'),
      timeout: '30 seconds',
    },
    {
      batch: {
        size: 50,
        partialResponses: true,
      },
    },
  );

  return {
    creditSpendingQueue,
  };
}
