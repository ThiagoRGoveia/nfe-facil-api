import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
import { WebhooksResolver } from './presenters/graphql/resolvers/webhooks.resolver';
import { WebhookDbPort } from './application/ports/webhook-db.port';
import { WebhookDeliveryDbPort } from './application/ports/webhook-delivery-db.port';
import { WebhookMikroOrmDbRepository } from './infra/persistence/db/orm/webhook-mikro-orm-db.repository';
import { WebhookDeliveryMikroOrmDbRepository } from './infra/persistence/db/orm/webhook-delivery-mikro-orm-db.repository';
import { CreateWebhookUseCase } from './application/use-cases/create-webhook.use-case';
import { UpdateWebhookUseCase } from './application/use-cases/update-webhook.use-case';
import { DeleteWebhookUseCase } from './application/use-cases/delete-webhook.use-case';
import { RetryWebhookDeliveryUseCase } from './application/use-cases/retry-webhook-delivery.use-case';
import { NotifyWebhookUseCase } from './application/use-cases/notify-webhook.use-case';
import { WebhookDispatcherPort } from './application/ports/webhook-dispatcher.port';
import { HttpWebhookDispatcherAdapter } from './infra/adapters/http-webhook-dispatcher.adapter';
import { HttpClientAdapter } from '@/core/webhooks/infra/adapters/http-client.adapter';
import { HttpClientPort } from '@/core/webhooks/application/ports/http-client.port';
import { WebhooksController } from './presenters/rest/controllers/webhooks.controller';

const controllers = [WebhooksController];
const resolvers = [WebhooksResolver];
const defaultProviders = [
  {
    provide: WebhookDbPort,
    useClass: WebhookMikroOrmDbRepository,
  },
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
  CreateWebhookUseCase,
  UpdateWebhookUseCase,
  DeleteWebhookUseCase,
  RetryWebhookDeliveryUseCase,
  NotifyWebhookUseCase,
];

const exportValues = [
  WebhookDbPort,
  WebhookDeliveryDbPort,
  WebhookDispatcherPort,
  HttpClientPort,
  CreateWebhookUseCase,
  UpdateWebhookUseCase,
  DeleteWebhookUseCase,
  RetryWebhookDeliveryUseCase,
  NotifyWebhookUseCase,
];

@Global()
@Module({
  // providers: [...defaultProviders, ...resolvers],
  // exports: exportValues,
})
export class WebhooksModule {
  static register(@Optional() @Inject('API_TYPE') apiType: 'rest' | 'graphql' | 'all' = 'all'): DynamicModule {
    const providers = [...(apiType === 'graphql' || apiType === 'all' ? resolvers : []), ...defaultProviders];

    return {
      module: WebhooksModule,
      controllers: apiType === 'rest' || apiType === 'all' ? controllers : [],
      providers,
      exports: exportValues,
    };
  }
}

export {
  WebhookDbPort,
  WebhookDeliveryDbPort,
  CreateWebhookUseCase,
  UpdateWebhookUseCase,
  DeleteWebhookUseCase,
  RetryWebhookDeliveryUseCase,
  NotifyWebhookUseCase,
};
