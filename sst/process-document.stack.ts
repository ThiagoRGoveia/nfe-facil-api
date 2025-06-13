// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { getConfig } from './api.stack';

export function ProcessDocumentStack() {
  const processDocumentQueue = new sst.aws.Queue('ProcessDocumentQueue', {
    fifo: true,
    visibilityTimeout: '40 seconds',
  });

  processDocumentQueue.subscribe(
    {
      ...getConfig('index.handler', 'dist/apps/process-document-job'),
      timeout: '40 seconds',
    },
    {
      batch: {
        size: 1,
        partialResponses: true,
      },
    },
  );

  return {
    processDocumentQueue,
  };
}
