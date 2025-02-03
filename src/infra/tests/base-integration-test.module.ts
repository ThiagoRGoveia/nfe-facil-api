import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DataloaderType, defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { UuidAdapter } from '../adapters/uuid.adapter';
import { SecretAdapter } from '../adapters/secret.adapter';
import { AuthPort } from '../auth/ports/auth.port';

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
        dbName: process.env.TEST_ORM_DATABASE,
        user: process.env.TEST_ORM_USERNAME,
        password: process.env.TEST_ORM_PASSWORD,
        host: process.env.TEST_ORM_HOST,
        port: Number(process.env.TEST_ORM_PORT),
        dataloader: DataloaderType.ALL,
        loadStrategy: 'select-in',
      }),
    ),
  ],
  controllers: [],
  providers: [
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
  ],
  exports: [PinoLogger, UuidAdapter, SecretAdapter, AuthPort],
})
export class BaseIntegrationTestModule {}
