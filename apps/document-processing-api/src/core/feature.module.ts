import { Global, Module } from '@nestjs/common';
import { DocumentsModule } from '@lib/documents/documents.module';
import { TemplateMikroOrmDbRepositoryProvider } from '@lib/templates/core/infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { UserMikroOrmDbRepositoryProvider } from '@lib/users/core/infra/persistence/db/orm/users-mikro-orm-db.repository';
import { NFSeController } from '@lib/documents/core/presenters/http/controllers/nfse.controller';
import { NFSeWebhooksController } from '@lib/documents/core/presenters/http/controllers/nfse-webhooks.controller';
import { NfeModule } from '@lib/workflows';

@Global()
@Module({
  providers: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
  controllers: [NFSeController, NFSeWebhooksController],
  imports: [DocumentsModule, NfeModule],
  exports: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
})
export class FeatureModule {}
