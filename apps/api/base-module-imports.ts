import { LoggerModule } from 'nestjs-pino';
import { defineConfig } from '@mikro-orm/postgresql';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Migrator } from '@mikro-orm/migrations';
import { DataloaderType } from '@mikro-orm/core';
import entities from 'apps/api/src/infra/persistence/mikro-orm/entities';

export const baseImports = [
  HttpModule,
  LoggerModule.forRootAsync({
    useFactory: (configService: ConfigService) => ({
      forRoutes: ['*'],
      pinoHttp:
        configService.get('NODE_ENV') !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                },
              },
            }
          : undefined,
    }),
    inject: [ConfigService],
  }),
  MikroOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      return defineConfig({
        entities: entities,
        entitiesTs: entities,
        dbName: configService.get('DB_DATABASE'),
        user: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        host: configService.get('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        extensions: [Migrator],
        dataloader: DataloaderType.ALL,
        serialization: { forceObject: true },
        loadStrategy: 'select-in',
        useBatchInserts: true,
        useBatchUpdates: true,
        resultCache: {
          expiration: 1000,
          global: true,
        },
        debug: false,
        migrations: {
          tableName: 'mikro_orm_migrations',
          path: `./dist/infra/db/mikro-orm/migrations`,
          pathTs: `./src/infra/db/mikro-orm/migrations`,
          glob: '!(*.d).{js,ts}',
          safe: true,
          transactional: true,
          allOrNothing: true,
          emit: 'ts',
        },
        driverOptions: { connection: { ssl: { rejectUnauthorized: false } } },
      });
    },
  }),
];
