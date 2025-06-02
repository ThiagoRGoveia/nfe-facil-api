import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
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
import { BatchProcessesResolver } from './core/presenters/graphql/resolvers/batch-processes.resolver';
import { HandleOutputFormatUseCase } from './core/application/use-cases/handle-output-format.use-case';
import { FilesResolver } from './core/presenters/graphql/resolvers/files.resolver';
import { PublicFileProcessDbPort } from './core/application/ports/public-file-process-db.port';
import { PublicFileProcessMikroOrmDbRepository } from './core/infra/persistence/db/orm/public-file-process-mikro-orm-db.repository';
import { NFSeController } from './core/presenters/http/controllers/nfse.controller';
import { NFSeWebhooksController } from './core/presenters/http/controllers/nfse-webhooks.controller';

const controllers = [NFSeController, NFSeWebhooksController];
const resolvers = [BatchProcessesResolver, FilesResolver];
const defaultProviders = [
  CreateBatchProcessUseCase,
  UpdateBatchTemplateUseCase,
  AddFileToBatchUseCase,
  CancelBatchProcessUseCase,
  AsyncBatchProcessUseCase,
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
