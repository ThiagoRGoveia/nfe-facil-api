// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

// import { ProcessDocumentStack } from './sst/process-document.stack';
// import { ApiStack } from './sst/api.stack';
import { ApiStack } from 'sst/api.stack';
import { DocsStack } from './sst/docs.stack';
import { ProcessDocumentStack } from 'sst/process-document.stack';

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
    const { site, url } = DocsStack();

    return Promise.resolve({
      api,
      processDocumentQueue,
      docsUrl: url,
      docsSite: site,
    });
  },
});
