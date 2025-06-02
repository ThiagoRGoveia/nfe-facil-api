import { Module } from '@nestjs/common';
import { DocumentsModule } from '@lib/documents/documents.module';
import { UsersModule } from '@lib/users/users.module';
import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';

@Module({
  imports: [DocumentsModule, WebhooksModule, UsersModule],
})
export class FeatureModule {}
