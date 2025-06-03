import { defineConfig } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import entities from '@lib/database/infra/persistence/mikro-orm/entities';
import { DataloaderType } from '@mikro-orm/core';

export function dbConfig(configService: ConfigService) {
  return defineConfig({
    entities: entities,
    entitiesTs: entities,
    dbName: configService.get('DB_DATABASE'),
    user: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    host: configService.get('DB_HOST'),
    port: Number(configService.get('DB_PORT')),
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
    driverOptions:
      configService.get('NODE_ENV') === 'uat' ? { connection: { ssl: { rejectUnauthorized: false } } } : undefined,
  });
}
