import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { defineConfig } from '@mikro-orm/postgresql';

/**
 *
 * @ignore
 */
export function useUnitTestModule() {
  return {
    module: class MockModule {},
    global: true,
    imports: [
      ConfigModule.forRoot({
        envFilePath: '.test.env',
        isGlobal: true,
      }),
      MikroOrmModule.forRoot(
        defineConfig({
          connect: false,
          entities: ['**/*.entity.ts'],
          entitiesTs: ['**/*.entity.ts'],
          dbName: 'test',
          allowGlobalContext: true,
        }),
      ),
    ],
    providers: [],
    exports: [],
  };
}
