import { Module, DynamicModule } from '@nestjs/common';
import { DocumentsModule } from './documents/documents.module';
import { TemplatesModule } from './templates/templates.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UsersModule } from './users/users.module';
import { UserCreditsModule } from './user-credits/user-credits.module';

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
