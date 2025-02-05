import { MikroORM } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export async function useDbSchema(orm: MikroORM) {
  const dbName = uuidv4();
  const generator = orm.getSchemaGenerator();

  // Create the database
  await generator.createDatabase(dbName);

  // Update the connection to use the new database
  await orm.close();
  orm.config.set('dbName', dbName);
  await orm.connect();

  // Now refresh the schema in the new database
  await generator.refreshDatabase();

  return dbName;
}

export async function useDbDrop(orm: MikroORM, dbName: string) {
  const generator = orm.getSchemaGenerator();
  await generator.dropDatabase(dbName);
  await orm.close(true);
}
