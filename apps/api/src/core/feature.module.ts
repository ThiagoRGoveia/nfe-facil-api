import { Global, Module } from '@nestjs/common';
import { DocumentsModule } from '@lib/documents/documents.module';
import { UsersModule } from '@lib/users/users.module';
import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { TemplateMikroOrmDbRepositoryProvider } from '@lib/templates/core/infra/persistence/db/orm/templates-mikro-orm-db.repository';

@Global()
@Module({
  providers: [TemplateMikroOrmDbRepositoryProvider],
  imports: [DocumentsModule, WebhooksModule, UsersModule],
  exports: [TemplateMikroOrmDbRepositoryProvider],
})
export class FeatureModule {}
