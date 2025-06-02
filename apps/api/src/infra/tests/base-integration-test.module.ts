import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DataloaderType, defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { EncryptionPort } from '../../../../../libs/tooling/encryption/src/core/ports/encryption.port';
import { EncryptionAdapter } from '../../../../../libs/tooling/encryption/src/core/adapters/encryption.adapter';
import { DatabaseLifecycleService } from './database-lifecycle.service';
import { ZipPort } from '../../../../../libs/tooling/zip/src/core/zip.port';
import { DatePort } from '../../../../../libs/tooling/date/src/core/date.adapter';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { SecretAdapter } from '@lib/secrets/core/secret.adapter';
import { AuthPort } from '@lib/auth/core/ports/auth.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { CsvPort } from '@lib/csv/core/ports/csv.port';
import { ExcelPort } from '@lib/excel/core/ports/excel.port';
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.test.local',
      isGlobal: true,
    }),
    MikroOrmModule.forRoot(
      defineConfig({
        entities: ['**/*.entity.ts'],
        entitiesTs: ['**/*.entity.ts'],
        allowGlobalContext: true,
        user: process.env.TEST_ORM_USERNAME,
        password: process.env.TEST_ORM_PASSWORD,
        host: process.env.TEST_ORM_HOST,
        port: Number(process.env.TEST_ORM_PORT),
        dbName: process.env.TEST_ORM_DATABASE,
        dataloader: DataloaderType.ALL,
        loadStrategy: 'select-in',
        serialization: { forceObject: true },
      }),
    ),
  ],
  controllers: [],
  providers: [
    DatabaseLifecycleService,
    UuidAdapter,
    SecretAdapter,
    {
      provide: PinoLogger,
      useValue: createMock<PinoLogger>(),
    },
    {
      provide: AuthPort,
      useValue: createMock<AuthPort>(),
    },
    {
      provide: EncryptionPort,
      useClass: EncryptionAdapter,
    },
    {
      provide: FileStoragePort,
      useValue: createMock<FileStoragePort>(),
    },
    {
      provide: QueuePort,
      useValue: createMock<QueuePort>(),
    },
    {
      provide: ZipPort,
      useValue: createMock<ZipPort>(),
    },
    {
      provide: CsvPort,
      useValue: createMock<CsvPort>(),
    },
    {
      provide: ExcelPort,
      useValue: createMock<ExcelPort>(),
    },
    {
      provide: DatePort,
      useValue: createMock<DatePort>(),
    },
  ],
  exports: [
    DatabaseLifecycleService,
    PinoLogger,
    UuidAdapter,
    SecretAdapter,
    AuthPort,
    EncryptionPort,
    FileStoragePort,
    QueuePort,
    ZipPort,
    CsvPort,
    ExcelPort,
    DatePort,
  ],
})
export class BaseIntegrationTestModule {}
