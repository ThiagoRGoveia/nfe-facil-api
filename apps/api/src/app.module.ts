import { Module } from '@nestjs/common';
import { YogaDriverConfig } from '@graphql-yoga/nestjs';
import { YogaDriver } from '@graphql-yoga/nestjs';
import { GraphQLModule } from '@nestjs/graphql';
import { FeatureModule } from './core/feature.module';
import { ToolingModule } from './infra/tooling.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UsersResolver } from '@lib/users';
import { FilesResolver } from '@lib/documents/core/presenters/graphql/resolvers/files.resolver';
import { BatchProcessesResolver } from '@lib/documents/core/presenters/graphql/resolvers/batch-processes.resolver';
import { WebhooksResolver } from '@lib/webhooks/core/presenters/graphql/resolvers/webhooks.resolver';
import { dbConfig } from '@lib/database/infra/config/config';
import { loggerConfig } from '@lib/commons/infra/configs/logger.config';

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
      useFactory: loggerConfig,
      inject: [ConfigService],
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: dbConfig,
    }),
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      introspection: true,
      autoSchemaFile: true,
      sortSchema: true,
      context: (ctx) => ctx,
    }),
    FeatureModule,
    ToolingModule,
  ],
  providers: [UsersResolver, FilesResolver, WebhooksResolver, BatchProcessesResolver],
  controllers: [],
  exports: [],
})
export class AppModule {}
