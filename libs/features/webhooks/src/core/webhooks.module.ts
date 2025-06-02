import { Global, Module } from '@nestjs/common';
import { WebhookDbPort } from './application/ports/webhook-db.port';
import { WebhookMikroOrmDbRepository } from './infra/persistence/db/orm/webhook-mikro-orm-db.repository';
import { CreateWebhookUseCase } from './application/use-cases/create-webhook.use-case';
import { UpdateWebhookUseCase } from './application/use-cases/update-webhook.use-case';
import { DeleteWebhookUseCase } from './application/use-cases/delete-webhook.use-case';

@Global()
@Module({
  providers: [
    {
      provide: WebhookDbPort,
      useClass: WebhookMikroOrmDbRepository,
    },

    CreateWebhookUseCase,
    UpdateWebhookUseCase,
    DeleteWebhookUseCase,
  ],
  exports: [WebhookDbPort, CreateWebhookUseCase, UpdateWebhookUseCase, DeleteWebhookUseCase],
})
export class WebhooksModule {}
