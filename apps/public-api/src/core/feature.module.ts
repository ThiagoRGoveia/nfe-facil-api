import { Global, Module } from '@nestjs/common';
import { DocumentsModule } from '@lib/documents/documents.module';
import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { TemplateMikroOrmDbRepositoryProvider } from '@lib/templates/core/infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { UserMikroOrmDbRepositoryProvider } from '@lib/users/core/infra/persistence/db/orm/users-mikro-orm-db.repository';
import { NFSeController } from '@lib/documents/core/presenters/http/controllers/nfse.controller';
import { NFSeWebhooksController } from '@lib/documents/core/presenters/http/controllers/nfse-webhooks.controller';
import { WebhookDispatcherModule } from '@lib/webhook-dispatcher';
import { AuthModule } from '@lib/auth';
import { UserCreditsModule } from '@lib/user-credits';
import { StripeController } from '@lib/user-credits/core/presenters/http/controllers/stripe.controller';

@Global()
@Module({
  providers: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
  controllers: [NFSeController, NFSeWebhooksController, StripeController],
  imports: [AuthModule, DocumentsModule, WebhooksModule, WebhookDispatcherModule, UserCreditsModule],
  exports: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
})
export class FeatureModule {}
