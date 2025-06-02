import { Global, Module } from '@nestjs/common';
import { NfeTextWorkflow } from './nfe/nfse-text.workflow';
import { TogetherClient } from './infra/clients/together-client';
import { SyncFileProcessUseCase } from './core/application/use-cases/sync-file-process.use-case';
import { ProcessFileUseCase } from './core/application/use-cases/process-file.use-case';
import { DocumentProcessorAdapterProvider } from './infra/pdf/adapters/document-processor.adapter';
import { DocumentProcessorPort } from './core/application/ports/document-processor.port';
import { HttpModule } from '@nestjs/axios';
import { PdfAdapterProvider } from './infra/pdf/adapters/pdf.adapter';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    TogetherClient,
    NfeTextWorkflow,
    SyncFileProcessUseCase,
    ProcessFileUseCase,
    DocumentProcessorAdapterProvider,
    PdfAdapterProvider,
  ],
  exports: [NfeTextWorkflow, SyncFileProcessUseCase, ProcessFileUseCase, DocumentProcessorPort, PdfAdapterProvider],
})
export class NfeModule {}
