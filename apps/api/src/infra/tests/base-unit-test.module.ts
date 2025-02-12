import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createMock } from '@golevelup/ts-jest';
import { AuthPort } from '../auth/ports/auth.port';
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
        envFilePath: '.env.test.local',
        isGlobal: true,
      }),
      MikroOrmModule.forRoot(
        defineConfig({
          connect: false,
          entities: ['**/*.entity.ts'],
          entitiesTs: ['**/*.entity.ts'],
          dbName: 'test',
          allowGlobalContext: true,
          serialization: { forceObject: true },
        }),
      ),
    ],
    providers: [
      {
        provide: PinoLogger,
        useValue: createMock<PinoLogger>(),
      },
      {
        provide: AuthPort,
        useValue: createMock<AuthPort>(),
      },
    ],
    exports: [PinoLogger, AuthPort],
  };
}
