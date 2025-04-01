// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

import { getConfig } from "./api.stack";

export function OutputConsolidationStack() {
  const outputConsolidationQueue = new sst.aws.Queue('OutputConsolidationQueue', {
    fifo: false,
    visibilityTimeout: '25 minutes',
  });

  outputConsolidationQueue.subscribe(
    {
      ...getConfig('index.handler', 'dist/apps/output-consolidation-job'),
    },
    {
      batch: {
        size: 10,
        window: '5 seconds',
      },
    },
  );

  return {
    outputConsolidationQueue,
  };
} 