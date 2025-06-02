import { BatchDbPort } from '@lib/documents/core/application/ports/batch-db.port';
import { AddFileToBatchUseCase } from '@lib/documents/core/application/use-cases/add-file-to-batch.use-case';
import { AsyncBatchProcessUseCase } from '@lib/documents/core/application/use-cases/async-batch-process.use-case';
import { CancelBatchProcessUseCase } from '@lib/documents/core/application/use-cases/cancel-batch-process.use-case';
import { CreateBatchProcessUseCase } from '@lib/documents/core/application/use-cases/create-batch-process.use-case';
import { SyncFileProcessUseCase } from '@lib/documents/core/application/use-cases/sync-file-process.use-case';
import { NFSeWebhooksController } from '@lib/documents/core/presenters/http/controllers/nfse-webhooks.controller';
import { NFSeController } from '@lib/documents/core/presenters/http/controllers/nfse.controller';
import {
  CreateWebhookUseCase,
  DeleteWebhookUseCase,
  NotifyWebhookUseCase,
  UpdateWebhookUseCase,
  WebhookDbPort,
} from '@lib/webhooks/core/webhooks.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
  ],
  controllers: [NFSeController, NFSeWebhooksController],
  providers: [
    {
      provide: CreateBatchProcessUseCase,
      useValue: () => {},
    },
    {
      provide: AddFileToBatchUseCase,
      useValue: () => {},
    },
    {
      provide: CancelBatchProcessUseCase,
      useValue: () => {},
    },
    {
      provide: AsyncBatchProcessUseCase,
      useValue: () => {},
    },
    {
      provide: SyncFileProcessUseCase,
      useValue: () => {},
    },
    {
      provide: BatchDbPort,
      useValue: () => {},
    },
    {
      provide: WebhookDbPort,
      useValue: () => {},
    },
    {
      provide: CreateWebhookUseCase,
      useValue: () => {},
    },
    {
      provide: UpdateWebhookUseCase,
      useValue: () => {},
    },
    {
      provide: DeleteWebhookUseCase,
      useValue: () => {},
    },
    {
      provide: NotifyWebhookUseCase,
      useValue: () => {},
    },
  ],
})
export class NFSeDocModule {}
