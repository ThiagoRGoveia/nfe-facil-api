import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthzModule } from './infra/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infra/auth/jwt.guard';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DataloaderType, defineConfig } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YogaDriverConfig } from '@graphql-yoga/nestjs';
import { YogaDriver } from '@graphql-yoga/nestjs';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    AuthzModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      introspection: true,
      autoSchemaFile: true,
      sortSchema: true,
      context: (ctx) => ctx,
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return defineConfig({
          entities: ['**/*.entity.ts'],
          entitiesTs: ['**/*.entity.ts'],
          dbName: configService.get('DB_DATABASE'),
          user: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          host: configService.get('DB_HOST'),
          port: Number(configService.get('DB_PORT')),
          extensions: [Migrator],
          dataloader: DataloaderType.ALL,
          loadStrategy: 'select-in',
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
        });
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
