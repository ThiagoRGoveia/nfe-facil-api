import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { AuthPort } from '../auth/ports/auth.port';
import { UuidAdapter } from '../adapters/uuid.adapter';
import { SecretAdapter } from '../adapters/secret.adapter';
import { EncryptionPort } from '../encryption/ports/encryption.port';
import { FileStoragePort } from '../aws/s3/ports/file-storage.port';
import { QueuePort } from '../aws/sqs/ports/queue.port';
import { ZipPort } from '../zip/zip.port';
import { CsvPort } from '../json-to-csv/ports/csv.port';
import { ExcelPort } from '../excel/ports/excel.port';
import { DatePort } from '../adapters/date.adapter';
/**
 *
 * @ignore
 */
export function useUnitTestModule() {
  return {
    module: class MockModule {},
    global: true,
    imports: [
      ConfigModule.forRoot({
        envFilePath: '.env.test.local',
        isGlobal: true,
      }),
      MikroOrmModule.forRoot(
        defineConfig({
          connect: false,
          entities: ['**/*.entity.ts'],
          entitiesTs: ['**/*.entity.ts'],
          dbName: 'test',
          allowGlobalContext: true,
          serialization: { forceObject: true },
        }),
      ),
    ],
    providers: [
      {
        provide: UuidAdapter,
        useValue: createMock<UuidAdapter>(),
      },
      {
        provide: SecretAdapter,
        useValue: createMock<SecretAdapter>(),
      },
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
        useValue: createMock<EncryptionPort>(),
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
      PinoLogger,
      AuthPort,
      UuidAdapter,
      SecretAdapter,
      EncryptionPort,
      FileStoragePort,
      QueuePort,
      ZipPort,
      CsvPort,
      ExcelPort,
      DatePort,
    ],
  };
}
