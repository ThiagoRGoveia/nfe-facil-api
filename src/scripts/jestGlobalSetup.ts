import { MikroORM } from '@mikro-orm/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { defineConfig } from '@mikro-orm/postgresql';

module.exports = async () => {
  // Load test environment variables
  console.log('SETUP JEST');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test.local') });

  const orm = await MikroORM.init(
    defineConfig({
      dbName: process.env.TEST_ORM_DATABASE,
      host: process.env.TEST_ORM_HOST,
      port: parseInt(process.env.TEST_ORM_PORT!),
      user: process.env.TEST_ORM_USERNAME,
      password: process.env.TEST_ORM_PASSWORD,
      discovery: { warnWhenNoEntities: false },
    }),
  );

  try {
    const generator = orm.getSchemaGenerator();

    // Get list of all databases
    const result = await orm.em.execute(`
      SELECT datname 
      FROM pg_database 
      WHERE datname LIKE 'test_db_%'
    `);

    // Drop each test database
    for (const row of result) {
      try {
        await generator.dropDatabase(row.datname);
        console.log(`Dropped test database: ${row.datname}`);
      } catch (err) {
        console.error(`Error dropping ${row.datname}:`, err.message);
      }
    }
  } finally {
    await orm.close(true);
  }
};
