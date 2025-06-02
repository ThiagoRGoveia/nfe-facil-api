import { Global, Module } from '@nestjs/common';
import { ZipPort } from 'libs/tooling/zip/src/core/zip.port';
import { HttpModule } from '@nestjs/axios';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/core';
import { AuthModule } from '@lib/auth/auth.module';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { SecretAdapter } from '@lib/secrets/core/secret.adapter';
import { ZipAdapter } from '@lib/zip/core/adapters/zip.adapter';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { S3Client } from '@aws-sdk/client-s3';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { SQSAdapter } from '@lib/queue/core/adapters/sqs.adapter';
import { SQSClient } from '@lib/queue/core/clients/sqs.client';
import { DateAdapter, DatePort } from '@lib/date/core/date.adapter';
import { EncryptionPort } from '@lib/encryption/core/ports/encryption.port';
import { EncryptionAdapter } from '@lib/encryption/core/adapters/encryption.adapter';

@Global()
@Module({
  imports: [AuthModule, HttpModule],
  providers: [
    UuidAdapter,
    SecretAdapter,
    {
      provide: EncryptionPort,
      useClass: EncryptionAdapter,
    },
    {
      provide: ZipPort,
      useClass: ZipAdapter,
    },
    {
      provide: FileStoragePort,
      useClass: S3Client,
    },
    {
      provide: QueuePort,
      useClass: SQSAdapter,
    },
    {
      provide: DatePort,
      useClass: DateAdapter,
    },
    SQSClient,
    {
      provide: SqlEntityManager,
      useFactory: (em: EntityManager) => em,
      inject: [EntityManager],
    },
  ],
  exports: [
    EncryptionPort,
    UuidAdapter,
    SecretAdapter,
    ZipPort,
    FileStoragePort,
    QueuePort,
    DatePort,
    SqlEntityManager,
  ],
})
export class ToolingModule {}
