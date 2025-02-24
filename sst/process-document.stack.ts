// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

export function ProcessDocumentStack() {
  const processDocumentQueue = new sst.aws.Queue('ProcessDocumentQueue', {
    fifo: false,
    visibilityTimeout: '5 minutes',
  });

  processDocumentQueue.subscribe(
    {
      bundle: 'dist/apps/process-document-job',
      handler: 'lambda.handler',
      runtime: 'nodejs20.x',
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
