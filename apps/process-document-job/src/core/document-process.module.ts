import { Global, Module } from '@nestjs/common';
import { PdfPort } from '../infra/pdf/ports/pdf.port';
import { PdfAdapter } from '../infra/pdf/adapters/pdf.adapter';
import { NfeTextWorkflow } from 'libs/workflows/src/nfe/nfse-text.workflow';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    NfeTextWorkflow,
    {
      provide: PdfPort,
      useClass: PdfAdapter,
    },
  ],
  exports: [NfeTextWorkflow],
})
export class DocumentProcessModule {}
