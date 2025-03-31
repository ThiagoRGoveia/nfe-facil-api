// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { getConfig } from "./api.stack";

export function ProcessDocumentStack() {
  const processDocumentQueue = new sst.aws.Queue('ProcessDocumentQueue', {
    fifo: false,
    visibilityTimeout: '5 minutes',
  });

  processDocumentQueue.subscribe(
    {
      ...getConfig('index.handler', 'dist/apps/process-document-job'),
    },
    {
      batch: {
        size: 10,
      },
    },
  );

  return {
    processDocumentQueue,
  };
}
