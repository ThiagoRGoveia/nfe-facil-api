import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { dbConfig } from '@lib/database/infra/config/config';
import { loggerConfig } from '@lib/commons/infra/configs/logger.config';
import { ProcessDocumentJobService } from './core/process-document-job.service';
import { DatePortProvider } from '@lib/date/core/date.adapter';
import { NfeModule } from '@lib/workflows';
import { WebhookDispatcherModule } from '@lib/webhook-dispatcher';
import { DocumentsModule } from '@lib/documents';
import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { TemplateMikroOrmDbRepositoryProvider } from '@lib/templates/core/infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { ProcessFileUseCase } from '@lib/workflows/core/application/use-cases/process-file.use-case';
import { FileStoragePortProvider } from '@lib/file-storage/core/clients/s3.client';
import { ZipAdapterProvider } from '@lib/zip/core/adapters/zip.adapter';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { QueuePortProvider } from '@lib/queue/core/adapters/sqs.adapter';
import { EncryptionAdapterProvider } from '@lib/encryption/core/adapters/encryption.adapter';
import { SQSClient } from '@lib/queue/core/clients/sqs.client';

@Global()
@Module({
  providers: [TemplateMikroOrmDbRepositoryProvider, DatePortProvider, ProcessFileUseCase],
  exports: [TemplateMikroOrmDbRepositoryProvider, DatePortProvider, ProcessFileUseCase],
})
class FeatureModule {}

@Global()
@Module({
  providers: [
    UuidAdapter,
    FileStoragePortProvider,
    ZipAdapterProvider,
    QueuePortProvider,
    EncryptionAdapterProvider,
    SQSClient,
  ],
  exports: [
    UuidAdapter,
    FileStoragePortProvider,
    ZipAdapterProvider,
    QueuePortProvider,
    EncryptionAdapterProvider,
    SQSClient,
  ],
})
class ToolingModule {}

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
    NfeModule,
    DocumentsModule,
    WebhooksModule,
    WebhookDispatcherModule,
    FeatureModule,
    ToolingModule,
  ],
  providers: [ProcessDocumentJobService],
  exports: [ProcessDocumentJobService],
})
export class AppModule {}
