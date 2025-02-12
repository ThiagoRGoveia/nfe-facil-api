import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DataloaderType, defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { UuidAdapter } from '../adapters/uuid.adapter';
import { SecretAdapter } from '../adapters/secret.adapter';
import { AuthPort } from '../auth/ports/auth.port';
import { EncryptionPort } from '../encryption/ports/encryption.port';
import { EncryptionAdapter } from '../encryption/adapters/encryption.adapter';
import { DatabaseLifecycleService } from './database-lifecycle.service';
import { FileStoragePort } from '../aws/s3/ports/file-storage.port';
import { QueuePort } from '../aws/sqs/ports/queue.port';
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
  ],
})
export class BaseIntegrationTestModule {}
