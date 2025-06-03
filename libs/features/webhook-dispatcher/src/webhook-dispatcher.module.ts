import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { Global, Module } from '@nestjs/common';
import { WebhookDeliveryMikroOrmDbRepositoryProvider } from './core/infra/persistence/db/orm/webhook-delivery-mikro-orm-db.repository';
import { HttpWebhookDispatcherAdapterProvider } from './core/infra/adapters/http-webhook-dispatcher.adapter';
import { HttpClientAdapterProvider } from './core/infra/adapters/http-client.adapter';
import { RetryWebhookDeliveryUseCase } from './core/application/use-cases/retry-webhook-delivery.use-case';
import { NotifyWebhookUseCase } from './core/application/use-cases/notify-webhook.use-case';
import { WebhookNotifierAdapterProvider } from '@lib/documents/core/infra/adapters/webhook-notifier.adapter';

@Global()
@Module({
  imports: [WebhooksModule],
  providers: [
    WebhookDeliveryMikroOrmDbRepositoryProvider,
    HttpWebhookDispatcherAdapterProvider,
    HttpClientAdapterProvider,
    WebhookNotifierAdapterProvider,
    RetryWebhookDeliveryUseCase,
    NotifyWebhookUseCase,
  ],
  exports: [
    HttpWebhookDispatcherAdapterProvider,
    HttpClientAdapterProvider,
    RetryWebhookDeliveryUseCase,
    NotifyWebhookUseCase,
    WebhookDeliveryMikroOrmDbRepositoryProvider,
    WebhookNotifierAdapterProvider,
  ],
})
export class WebhookDispatcherModule {}
