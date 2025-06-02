import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebhookDispatchJobService } from './core/services/webhook-dispatch-job.service';
import { WebhookDispatcherService } from './core/services/webhook-dispatcher.service';

import { WebhookDeliveryMikroOrmDbRepositoryProvider } from '@lib/webhook-dispatcher/core/infra/persistence/db/orm/webhook-delivery-mikro-orm-db.repository';
import { HttpClientAdapterProvider } from '@lib/webhook-dispatcher/core/infra/adapters/http-client.adapter';
import { EncryptionAdapterProvider } from '@lib/encryption/core/adapters/encryption.adapter';
import { MikroOrmLambdaCompatibilityConfig } from '@lib/commons/infra/configs/mikro-orm-lambda-compatibility.config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from '@lib/commons/infra/configs/logger.config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { dbConfig } from '@lib/database/infra/config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : undefined,
      isGlobal: true,
    }),
    HttpModule,
    LoggerModule.forRootAsync({
      useFactory: loggerConfig,
      inject: [ConfigService],
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: dbConfig,
    }),
  ],
  providers: [
    WebhookDispatchJobService,
    WebhookDispatcherService,
    WebhookDeliveryMikroOrmDbRepositoryProvider,
    HttpClientAdapterProvider,
    EncryptionAdapterProvider,
    MikroOrmLambdaCompatibilityConfig,
  ],
  exports: [MikroOrmLambdaCompatibilityConfig],
})
export class AppModule {}
