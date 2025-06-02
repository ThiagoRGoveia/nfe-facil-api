import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DataloaderType, defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { PdfPort } from 'apps/process-document-job/src/infra/pdf/ports/pdf.port';
import { HttpModule } from '@nestjs/axios';
import { TogetherClient } from '@lib/workflows/clients/together-client';
import { DatabaseLifecycleService } from '@dev-modules/dev-modules/tests/database-lifecycle.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.e2e.test',
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
    HttpModule,
  ],
  providers: [
    DatabaseLifecycleService,
    UuidAdapter,
    TogetherClient,
    {
      provide: PinoLogger,
      useValue: createMock<PinoLogger>(),
    },
    {
      provide: FileStoragePort,
      useValue: createMock<FileStoragePort>(),
    },
    {
      provide: PdfPort,
      useValue: createMock<PdfPort>(),
    },
  ],
  exports: [PinoLogger, UuidAdapter, FileStoragePort, PdfPort, TogetherClient],
})
export class BaseE2eTestModule {}
