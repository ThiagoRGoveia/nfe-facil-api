import { Global, Module } from '@nestjs/common';
import { EncryptionAdapter } from './encryption/adapters/encryption.adapter';
import { EncryptionPort } from './encryption/ports/encryption.port';
import { UuidAdapter } from './adapters/uuid.adapter';
import { SecretAdapter } from './adapters/secret.adapter';
import { ZipPort } from '@/infra/zip/zip.port';
import { ZipAdapter } from '@/infra/zip/zip.adapter';
import { CsvPort } from './json-to-csv/ports/csv.port';
import { Json2CsvAdapter } from './json-to-csv/adapters/json-2-csv.adapter';
import { ExcelPort } from './excel/ports/excel.port';
import { ExcelJsAdapter } from './excel/adapters/excel.adapter';
import { S3Client } from './aws/s3/clients/s3.client';
import { FileStoragePort } from './aws/s3/ports/file-storage.port';
import { QueuePort } from './aws/sqs/ports/queue.port';
import { SQSClient } from './aws/sqs/clients/sqs.client';
import { AuthModule } from './auth/auth.module';
import { DocumentProcessModule } from '@doc/document-process.module';
import { HttpModule } from '@nestjs/axios';
import { OllamaClient } from '@doc/workflows/clients/ollama-client';
import { DateAdapter } from './adapters/date.adapter';
import { DatePort } from './adapters/date.adapter';
import { TogetherClient } from '@doc/workflows/clients/together-client';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/core';

@Global()
@Module({
  imports: [AuthModule, DocumentProcessModule, HttpModule],
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
      provide: CsvPort,
      useClass: Json2CsvAdapter,
    },
    {
      provide: ExcelPort,
      useClass: ExcelJsAdapter,
    },
    {
      provide: FileStoragePort,
      useClass: S3Client,
    },
    {
      provide: QueuePort,
      useClass: SQSClient,
    },
    {
      provide: DatePort,
      useClass: DateAdapter,
    },
    OllamaClient,
    TogetherClient,
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
    CsvPort,
    ExcelPort,
    FileStoragePort,
    QueuePort,
    OllamaClient,
    DatePort,
    TogetherClient,
    SqlEntityManager,
  ],
})
export class ToolingModule {}
