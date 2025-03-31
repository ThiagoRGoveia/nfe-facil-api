import { Global, Module } from '@nestjs/common';
import { NfeTextWorkflow } from './workflows/nfe/nfse-text.workflow';
import { PdfPort } from '../infra/pdf/ports/pdf.port';
import { PdfAdapter } from '../infra/pdf/adapters/pdf.adapter';

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
