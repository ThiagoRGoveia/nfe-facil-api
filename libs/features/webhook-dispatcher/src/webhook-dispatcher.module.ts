import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { Global, Module } from '@nestjs/common';
import { WebhookDeliveryDbPort } from './core/application/ports/webhook-delivery-db.port';
import { WebhookDeliveryMikroOrmDbRepository } from './core/infra/persistence/db/orm/webhook-delivery-mikro-orm-db.repository';
import { WebhookDispatcherPort } from './core/application/ports/webhook-dispatcher.port';
import { HttpWebhookDispatcherAdapter } from './core/infra/adapters/http-webhook-dispatcher.adapter';
import { HttpClientPort } from './core/application/ports/http-client.port';
import { HttpClientAdapter } from '@lib/webhook-dispatcher/core/infra/adapters/http-client.adapter';
import { RetryWebhookDeliveryUseCase } from './core/application/use-cases/retry-webhook-delivery.use-case';
import { NotifyWebhookUseCase } from './core/application/use-cases/notify-webhook.use-case';

@Global()
@Module({
  imports: [WebhooksModule],
  providers: [
    {
      provide: WebhookDeliveryDbPort,
      useClass: WebhookDeliveryMikroOrmDbRepository,
    },
    {
      provide: WebhookDispatcherPort,
      useClass: HttpWebhookDispatcherAdapter,
    },
    {
      provide: HttpClientPort,
      useClass: HttpClientAdapter,
    },
    RetryWebhookDeliveryUseCase,
    NotifyWebhookUseCase,
  ],
  exports: [
    WebhookDeliveryDbPort,
    WebhookDispatcherPort,
    HttpClientPort,
    RetryWebhookDeliveryUseCase,
    NotifyWebhookUseCase,
  ],
})
export class WebhookDispatcherModule {}
