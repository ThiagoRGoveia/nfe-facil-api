import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import dotenv from 'dotenv';
import entities from './libs/tooling/database/src/infra/persistence/mikro-orm/entities';

dotenv.config();

export default defineConfig({
  entities: entities,
  entitiesTs: entities,
  dbName: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  extensions: [Migrator],
  debug: false,
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: `./dist/apps/api/src/infra/persistence/mikro-orm/migrations`,
    pathTs: `./apps/api/src/infra/persistence/mikro-orm/migrations`,
    glob: '!(*.d).{js,ts}',
    safe: true,
    transactional: true,
    allOrNothing: true,
    emit: 'ts',
  },
  seeder: {
    path: `./dist/apps/api/src/infra/persistence/mikro-orm/seed`,
    pathTs: `./apps/api/src/infra/persistence/mikro-orm/seed`,
    glob: '!(*.d).{js,ts}',
  },
  driverOptions:
    process.env.NODE_ENV !== 'production' ? { connection: { ssl: { rejectUnauthorized: false } } } : undefined,
});
