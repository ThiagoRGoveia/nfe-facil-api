import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '@lib/auth/auth.module';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { SecretAdapter } from '@lib/secrets/core/secret.adapter';
import { ZipAdapterProvider } from '@lib/zip/core/adapters/zip.adapter';
import { QueuePortProvider } from '@lib/queue/core/adapters/sqs.adapter';
import { DatePortProvider } from '@lib/date/core/date.adapter';
import { MikroOrmLambdaCompatibilityConfig } from '@lib/commons/infra/configs/mikro-orm-lambda-compatibility.config';
import { FileStoragePortProvider } from '@lib/file-storage/core/clients/s3.client';
import { SQSClient } from '@lib/queue/core/clients/sqs.client';

@Global()
@Module({
  imports: [AuthModule, HttpModule],
  providers: [
    UuidAdapter,
    SecretAdapter,
    ZipAdapterProvider,
    FileStoragePortProvider,
    QueuePortProvider,
    DatePortProvider,
    MikroOrmLambdaCompatibilityConfig,
    SQSClient,
  ],
  exports: [
    UuidAdapter,
    SecretAdapter,
    ZipAdapterProvider,
    FileStoragePortProvider,
    QueuePortProvider,
    DatePortProvider,
    MikroOrmLambdaCompatibilityConfig,
    SQSClient,
  ],
})
export class ToolingModule {}
