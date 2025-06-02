import { Global, Module } from '@nestjs/common';
import { CreateBatchProcessUseCase } from './core/application/use-cases/create-batch-process.use-case';
import { UpdateBatchTemplateUseCase } from './core/application/use-cases/update-batch-template.use-case';
import { AddFileToBatchUseCase } from './core/application/use-cases/add-file-to-batch.use-case';
import { CancelBatchProcessUseCase } from './core/application/use-cases/cancel-batch-process.use-case';
import { AsyncBatchProcessUseCase } from './core/application/use-cases/async-batch-process.use-case';

// Ports
import { BatchDbPort } from './core/application/ports/batch-db.port';
import { FileProcessDbPort } from './core/application/ports/file-process-db.port';
import { WebhookNotifierPort } from './core/application/ports/webhook-notifier.port';

// Repositories
import { BatchMikroOrmRepository } from './core/infra/persistence/db/orm/batch-process-mikro-orm-db.repository';
import { FileProcessMikroOrmDbRepository } from './core/infra/persistence/db/orm/file-process-mikro-orm-db.repository';

// Adapters
import { WebhookNotifierAdapter } from './core/infra/adapters/webhook-notifier.adapter';
import { DocumentProcessorPort } from './core/application/ports/document-processor.port';
import { DocumentProcessorAdapter } from './core/infra/adapters/document-processor.adapter';
import { HandleOutputFormatUseCase } from './core/application/use-cases/handle-output-format.use-case';
import { TriggerOutputConsolidationUseCase } from './core/application/use-cases/trigger-output-consolidation.use-case';

@Global()
@Module({
  providers: [
    CreateBatchProcessUseCase,
    UpdateBatchTemplateUseCase,
    AddFileToBatchUseCase,
    CancelBatchProcessUseCase,
    AsyncBatchProcessUseCase,
    HandleOutputFormatUseCase,
    TriggerOutputConsolidationUseCase,
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
    {
      provide: DocumentProcessorPort,
      useClass: DocumentProcessorAdapter,
    },
  ],
  exports: [
    CreateBatchProcessUseCase,
    UpdateBatchTemplateUseCase,
    AddFileToBatchUseCase,
    CancelBatchProcessUseCase,
    AsyncBatchProcessUseCase,
    HandleOutputFormatUseCase,
    TriggerOutputConsolidationUseCase,
    BatchDbPort,
    FileProcessDbPort,
    WebhookNotifierPort,
    DocumentProcessorPort,
  ],
})
export class DocumentsModule {}
