import { Global, Module } from '@nestjs/common';
import { DocumentsModule } from './documents/documents.module';
import { TemplatesModule } from './templates/templates.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UsersModule } from './users/users.module';
import { UserCreditsModule } from './user-credits/user-credits.module';

@Global()
@Module({
  imports: [DocumentsModule, TemplatesModule, WebhooksModule, UsersModule, UserCreditsModule],
  providers: [],
  exports: [],
})
export class FeatureModule {}
