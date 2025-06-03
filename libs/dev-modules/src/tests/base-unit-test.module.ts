import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { SecretAdapter } from '@lib/secrets/core/secret.adapter';
import { AuthPort } from '@lib/auth/core/ports/auth.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { CsvPort } from '@lib/csv/core/ports/csv.port';
import { ExcelPort } from '@lib/excel/core/ports/excel.port';
import { ZipPort } from '@lib/zip/core/zip.port';
import { EncryptionPort } from '@lib/encryption/core/ports/encryption.port';
import { DatePort } from '@lib/date/core/date.adapter';
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
