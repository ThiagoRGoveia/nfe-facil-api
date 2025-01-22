import { MikroORM } from '@mikro-orm/core';

export async function useDbSchema(orm: MikroORM) {
  const generator = orm.getSchemaGenerator();
  await generator.refreshDatabase();
}

export async function useDbRefresh(orm: MikroORM) {
  const generator = orm.getSchemaGenerator();
  await generator.dropSchema();
  await orm.close(true);
}
