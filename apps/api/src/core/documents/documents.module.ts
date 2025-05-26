import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
import { CreateBatchProcessUseCase } from './application/use-cases/create-batch-process.use-case';
import { UpdateBatchTemplateUseCase } from './application/use-cases/update-batch-template.use-case';
import { AddFileToBatchUseCase } from './application/use-cases/add-file-to-batch.use-case';
import { CancelBatchProcessUseCase } from './application/use-cases/cancel-batch-process.use-case';
import { AsyncBatchProcessUseCase } from './application/use-cases/async-batch-process.use-case';
import { SyncFileProcessUseCase } from './application/use-cases/sync-file-process.use-case';

// Ports
import { BatchDbPort } from './application/ports/batch-db.port';
import { FileProcessDbPort } from './application/ports/file-process-db.port';
import { WebhookNotifierPort } from './application/ports/webhook-notifier.port';

// Repositories
import { BatchMikroOrmRepository } from './infra/persistence/db/orm/batch-process-mikro-orm-db.repository';
import { FileProcessMikroOrmDbRepository } from './infra/persistence/db/orm/file-process-mikro-orm-db.repository';

// Adapters
import { WebhookNotifierAdapter } from './infra/adapters/webhook-notifier.adapter';
import { ProcessFileUseCase } from './application/use-cases/process-file.use-case';
import { DocumentProcessorPort } from './application/ports/document-processor.port';
import { DocumentProcessorAdapter } from './infra/adapters/document-processor.adapter';
import { BatchProcessesResolver } from './presenters/graphql/resolvers/batch-processes.resolver';
import { PublicSyncFileProcessUseCase } from './application/use-cases/public-sync-file-process.use-case';
import { HandleOutputFormatUseCase } from './application/use-cases/handle-output-format.use-case';
import { FilesResolver } from './presenters/graphql/resolvers/files.resolver';
import { PublicFileProcessDbPort } from './application/ports/public-file-process-db.port';
import { PublicFileProcessMikroOrmDbRepository } from './infra/persistence/db/orm/public-file-process-mikro-orm-db.repository';
import { NFSeController } from './presenters/http/controllers/nfse.controller';
import { NFSeWebhooksController } from './presenters/http/controllers/nfse-webhooks.controller';

const controllers = [NFSeController, NFSeWebhooksController];
const resolvers = [BatchProcessesResolver, FilesResolver];
const defaultProviders = [
  CreateBatchProcessUseCase,
  UpdateBatchTemplateUseCase,
  AddFileToBatchUseCase,
  CancelBatchProcessUseCase,
  AsyncBatchProcessUseCase,
  SyncFileProcessUseCase,
  ProcessFileUseCase,
  PublicSyncFileProcessUseCase,
  HandleOutputFormatUseCase,
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
  {
    provide: PublicFileProcessDbPort,
    useClass: PublicFileProcessMikroOrmDbRepository,
  },
];

const exportValues = [
  CreateBatchProcessUseCase,
  UpdateBatchTemplateUseCase,
  AddFileToBatchUseCase,
  CancelBatchProcessUseCase,
  AsyncBatchProcessUseCase,
  SyncFileProcessUseCase,
  ProcessFileUseCase,
  PublicSyncFileProcessUseCase,
  HandleOutputFormatUseCase,
  BatchDbPort,
  FileProcessDbPort,
  WebhookNotifierPort,
  DocumentProcessorPort,
  PublicFileProcessDbPort,
];

@Global()
@Module({
  // providers: [...defaultProviders, ...resolvers],
  // exports: exportValues,
})
export class DocumentsModule {
  static register(@Optional() @Inject('API_TYPE') apiType: 'rest' | 'graphql' | 'all' | 'none' = 'all'): DynamicModule {
    const providers = [...(apiType === 'graphql' || apiType === 'all' ? resolvers : []), ...defaultProviders];

    return {
      module: DocumentsModule,
      controllers: apiType === 'rest' || apiType === 'all' ? controllers : [],
      providers,
      exports: exportValues,
    };
  }
}
