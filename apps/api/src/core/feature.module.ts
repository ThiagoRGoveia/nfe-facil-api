import { Global, Module } from '@nestjs/common';
import { DocumentsModule } from './documents/documents.module';
import { TemplatesModule } from './templates/templates.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UsersModule } from './users/users.module';

@Global()
@Module({
  imports: [DocumentsModule, TemplatesModule, WebhooksModule, UsersModule],
  providers: [],
  exports: [],
})
export class FeatureModule {}
