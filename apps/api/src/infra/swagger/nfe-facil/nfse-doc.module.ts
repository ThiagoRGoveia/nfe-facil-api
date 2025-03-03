import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { AddFileToBatchUseCase } from '@/core/documents/application/use-cases/add-file-to-batch.use-case';
import { AsyncBatchProcessUseCase } from '@/core/documents/application/use-cases/async-batch-process.use-case';
import { CancelBatchProcessUseCase } from '@/core/documents/application/use-cases/cancel-batch-process.use-case';
import { CreateBatchProcessUseCase } from '@/core/documents/application/use-cases/create-batch-process.use-case';
import { SyncFileProcessUseCase } from '@/core/documents/application/use-cases/sync-file-process.use-case';
import { NFSeWebhooksController } from '@/core/documents/presenters/http/controllers/nfse-webhooks.controller';
import { NFSeController } from '@/core/documents/presenters/http/controllers/nfse.controller';
import { WebhookDbPort } from '@/core/webhooks/application/ports/webhook-db.port';
import { CreateWebhookUseCase } from '@/core/webhooks/application/use-cases/create-webhook.use-case';
import { DeleteWebhookUseCase } from '@/core/webhooks/application/use-cases/delete-webhook.use-case';
import { NotifyWebhookUseCase } from '@/core/webhooks/application/use-cases/notify-webhook.use-case';
import { UpdateWebhookUseCase } from '@/core/webhooks/application/use-cases/update-webhook.use-case';
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
