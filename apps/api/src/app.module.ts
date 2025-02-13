import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DataloaderType } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YogaDriverConfig } from '@graphql-yoga/nestjs';
import { YogaDriver } from '@graphql-yoga/nestjs';
import { GraphQLModule } from '@nestjs/graphql';
import { FeatureModule } from './core/feature.module';
import { ToolingModule } from './infra/tooling.module';
import { LoggerModule } from 'nestjs-pino';
import { defineConfig } from '@mikro-orm/postgresql';
import { User } from './core/users/domain/entities/user.entity';
import { FileToProcess } from './core/documents/domain/entities/file-process.entity';
import { BatchProcess } from './core/documents/domain/entities/batch-process.entity';
import { Template } from './core/templates/domain/entities/template.entity';

@Module({
  imports: [
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
          entities: [User, Template, BatchProcess, FileToProcess],
          entitiesTs: [User, Template, BatchProcess, FileToProcess],
          dbName: configService.get('DB_DATABASE'),
          user: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          host: configService.get('DB_HOST'),
          port: Number(configService.get('DB_PORT')),
          extensions: [Migrator],
          dataloader: DataloaderType.ALL,
          serialization: { forceObject: true },
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
    FeatureModule,
    ToolingModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
