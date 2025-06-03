import { Global, Module } from '@nestjs/common';
import { DocumentsModule } from '@lib/documents/documents.module';
import { TemplateMikroOrmDbRepositoryProvider } from '@lib/templates/core/infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { UserMikroOrmDbRepositoryProvider } from '@lib/users/core/infra/persistence/db/orm/users-mikro-orm-db.repository';
import { NfeModule } from '@lib/workflows';
import { NFSeController } from './nfse.controller';

@Global()
@Module({
  providers: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
  controllers: [NFSeController],
  imports: [DocumentsModule, NfeModule],
  exports: [TemplateMikroOrmDbRepositoryProvider, UserMikroOrmDbRepositoryProvider],
})
export class FeatureModule {}
