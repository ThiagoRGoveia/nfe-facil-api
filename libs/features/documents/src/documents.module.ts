import { Global, Module } from '@nestjs/common';
import { CreateBatchProcessUseCase } from './core/application/use-cases/create-batch-process.use-case';
import { UpdateBatchTemplateUseCase } from './core/application/use-cases/update-batch-template.use-case';
import { AddFileToBatchUseCase } from './core/application/use-cases/add-file-to-batch.use-case';
import { CancelBatchProcessUseCase } from './core/application/use-cases/cancel-batch-process.use-case';
import { AsyncBatchProcessUseCase } from './core/application/use-cases/async-batch-process.use-case';

// Ports
import { BatchDbPort } from './core/application/ports/batch-db.port';
import { FileProcessDbPort } from './core/application/ports/file-process-db.port';

// Repositories
import { BatchMikroOrmRepository } from './core/infra/persistence/db/orm/batch-process-mikro-orm-db.repository';
import { FileProcessMikroOrmDbRepository } from './core/infra/persistence/db/orm/file-process-mikro-orm-db.repository';

// Adapters
import { TriggerOutputConsolidationUseCase } from './core/application/use-cases/trigger-output-consolidation.use-case';
import { TriggerFileProcessUseCase } from './core/application/use-cases/trigger-file-process.use-case';

@Global()
@Module({
  providers: [
    CreateBatchProcessUseCase,
    UpdateBatchTemplateUseCase,
    AddFileToBatchUseCase,
    CancelBatchProcessUseCase,
    AsyncBatchProcessUseCase,
    TriggerOutputConsolidationUseCase,
    TriggerFileProcessUseCase,
    {
      provide: BatchDbPort,
      useClass: BatchMikroOrmRepository,
    },
    {
      provide: FileProcessDbPort,
      useClass: FileProcessMikroOrmDbRepository,
    },
  ],
  exports: [
    CreateBatchProcessUseCase,
    UpdateBatchTemplateUseCase,
    AddFileToBatchUseCase,
    CancelBatchProcessUseCase,
    AsyncBatchProcessUseCase,
    TriggerOutputConsolidationUseCase,
    BatchDbPort,
    FileProcessDbPort,
    TriggerFileProcessUseCase,
  ],
})
export class DocumentsModule {}
