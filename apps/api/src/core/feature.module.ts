import { Module, DynamicModule } from '@nestjs/common';
import { DocumentsModule } from '@lib/documents/documents.module';
import { TemplatesModule } from '@lib/templates/templates.module';
import { UsersModule } from '@lib/users/users.module';
import { UserCreditsModule } from '@lib/user-credits/user-credits.module';
import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';

@Module({
  // imports: [DocumentsModule, TemplatesModule, WebhooksModule, UsersModule, UserCreditsModule],
})
export class FeatureModule {
  static register(apiType: 'rest' | 'graphql' | 'all' | 'none' = 'all'): DynamicModule {
    return {
      module: FeatureModule,
      imports: [
        DocumentsModule.register(apiType),
        TemplatesModule.register(apiType),
        WebhooksModule.register(apiType),
        UsersModule.register(apiType),
        UserCreditsModule.register(apiType),
      ],
    };
  }
}
