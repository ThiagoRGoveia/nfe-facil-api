import { Global, Module } from '@nestjs/common';
import { DocumentsModule } from '@lib/documents/documents.module';
import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { TemplateMikroOrmDbRepositoryProvider } from '@lib/templates/core/infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { UserMikroOrmDbRepositoryProvider } from '@lib/users/core/infra/persistence/db/orm/users-mikro-orm-db.repository';
import { NFSeController } from '@lib/documents/core/presenters/http/controllers/nfse.controller';
import { NFSeWebhooksController } from '@lib/documents/core/presenters/http/controllers/nfse-webhooks.controller';
import { NfeModule } from '@lib/workflows';
import { WebhookDispatcherModule } from '@lib/webhook-dispatcher';
import { AuthModule } from '@lib/auth';

@Global()
@Module({
  providers: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
  controllers: [NFSeController, NFSeWebhooksController],
  imports: [AuthModule, DocumentsModule, WebhooksModule, NfeModule, WebhookDispatcherModule],
  exports: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
})
export class FeatureModule {}
