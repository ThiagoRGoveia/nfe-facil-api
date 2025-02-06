import { Module } from '@nestjs/common';
import { DocumentsController } from './presenters/http/controllers/documents.controller';
import { CreateBatchProcessUseCase } from './application/use-cases/create-batch-process.use-case';
import { UpdateBatchTemplateUseCase } from './application/use-cases/update-batch-template.use-case';
import { AddFileToBatchUseCase } from './application/use-cases/add-file-to-batch.use-case';
import { CancelBatchProcessUseCase } from './application/use-cases/cancel-batch-process.use-case';
import { AsyncBatchProcessUseCase } from './application/use-cases/async-batch-process.use-case';
import { SyncBatchProcessUseCase } from './application/use-cases/sync-batch-process.use-case';

// Ports
import { BatchDbPort } from './application/ports/batch-db.port';
import { FileProcessDbPort } from './application/ports/file-process-db.port';
import { WebhookNotifierPort } from './application/ports/webhook-notifier.port';
import { DocumentProcessorPort } from './application/ports/document-processor.port';
import { ZipPort } from './application/ports/zip.port';

// Repositories
import { BatchMikroOrmRepository } from './infra/persistence/db/orm/batch-process-mikro-orm-db.repository';
import { FileProcessMikroOrmDbRepository } from './infra/persistence/db/orm/document-process-mikro-orm-db.repository';

// Adapters
import { WebhookNotifierAdapter } from './infra/adapters/webhook-notifier.adapter';

@Module({
  controllers: [DocumentsController],
  providers: [
    CreateBatchProcessUseCase,
    UpdateBatchTemplateUseCase,
    AddFileToBatchUseCase,
    CancelBatchProcessUseCase,
    AsyncBatchProcessUseCase,
    SyncBatchProcessUseCase,

    {
      provide: BatchDbPort,
      useClass: BatchMikroOrmRepository,
    },
    {
      provide: FileProcessDbPort,
      useClass: FileProcessMikroOrmDbRepository,
    },
    {
      provide: WebhookNotifierPort,
      useClass: WebhookNotifierAdapter,
    },
  ],
  exports: [BatchDbPort, FileProcessDbPort, WebhookNotifierPort, DocumentProcessorPort, ZipPort],
})
export class DocumentsModule {}
