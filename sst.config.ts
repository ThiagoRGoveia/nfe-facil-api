// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

import { ApiStack } from './sst/api.stack';
import { ProcessDocumentStack } from './sst/process-document.stack';
import { OutputConsolidationStack } from './sst/output-consolidation.stack';
import { CreditSpendingStack } from './sst/credit-spending.stack';
import { WebhookDispatchStack } from './sst/webhook-dispatch.stack';
export default $config({
  app(input) {
    return {
      name: 'api',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
    };
  },
  async run() {
    const { api } = ApiStack();
    const { processDocumentQueue } = ProcessDocumentStack();
    const { outputConsolidationQueue } = OutputConsolidationStack();
    const { creditSpendingQueue, deadLetterQueue: creditSpendingDLQ } = CreditSpendingStack();
    const { webhookDispatchQueue, deadLetterQueue: webhookDispatchDLQ } = WebhookDispatchStack();
    return Promise.resolve({
      api: api.url,
      processDocumentQueue: processDocumentQueue.url,
      outputConsolidationQueue: outputConsolidationQueue.url,
      creditSpendingQueue: creditSpendingQueue.url,
      creditSpendingDLQ: creditSpendingDLQ.url,
      webhookDispatchQueue: webhookDispatchQueue.url,
      webhookDispatchDLQ: webhookDispatchDLQ.url,
    });
  },
});
