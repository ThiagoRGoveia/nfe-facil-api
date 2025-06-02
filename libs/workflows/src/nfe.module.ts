import { Module } from '@nestjs/common';
import { NfeTextWorkflow } from './nfe/nfse-text.workflow';
import { TogetherClient } from './clients/together-client';
import { SyncFileProcessUseCase } from './core/application/use-cases/sync-file-process.use-case';
import { ProcessFileUseCase } from './core/application/use-cases/process-file.use-case';
import { PublicSyncFileProcessUseCase } from './core/application/use-cases/public-sync-file-process.use-case';

@Module({
  providers: [
    TogetherClient,
    NfeTextWorkflow,
    SyncFileProcessUseCase,
    ProcessFileUseCase,
    PublicSyncFileProcessUseCase,
  ],
  exports: [NfeTextWorkflow, SyncFileProcessUseCase, ProcessFileUseCase, PublicSyncFileProcessUseCase],
})
export class NfeModule {}
