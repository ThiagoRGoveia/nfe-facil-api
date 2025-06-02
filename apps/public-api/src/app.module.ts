import { Module } from '@nestjs/common';
import { FeatureModule } from './core/feature.module';
import { ToolingModule } from './infra/tooling.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DataloaderType } from '@mikro-orm/core';
import entities from '@lib/database/infra/persistence/mikro-orm/entities';
import { defineConfig } from '@mikro-orm/postgresql';
import { AppController } from '../app.controller';

export interface AppModuleOptions {
  apiType?: 'rest' | 'graphql' | 'all';
}
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : undefined,
      isGlobal: true,
    }),
    HttpModule,
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        forRoutes: ['*'],
        pinoHttp:
          configService.get('NODE_ENV') !== 'production' && configService.get('NODE_ENV') !== 'uat'
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
            configService.get('NODE_ENV') === 'production' || configService.get('NODE_ENV') === 'uat'
              ? { connection: { ssl: { rejectUnauthorized: false } } }
              : undefined,
        });
      },
    }),
    FeatureModule,
    ToolingModule,
  ],
  controllers: [AppController],
  exports: [],
})
export class AppModule {}
