// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

import { ApiStack } from './sst/api.stack';
import { AppStack } from './sst/app.stack';
import { DocsStack } from './sst/docs.stack';
import { ProcessDocumentStack } from './sst/process-document.stack';

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
    const doc = DocsStack();
    const app = AppStack();
    return Promise.resolve({
      api,
      processDocumentQueue,
      docsUrl: doc.url,
      appUrl: app.url,
    });
  },
});
