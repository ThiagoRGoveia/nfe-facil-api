import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DataloaderType, defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { PdfPort } from '@doc/infra/pdf/ports/pdf.port';
import { HttpModule } from '@nestjs/axios';
import { TogetherClient } from '../workflows/clients/together-client';
import { DatabaseLifecycleService } from '@/infra/tests/database-lifecycle.service';

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
