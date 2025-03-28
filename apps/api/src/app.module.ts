import { Module, DynamicModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { YogaDriverConfig } from '@graphql-yoga/nestjs';
import { YogaDriver } from '@graphql-yoga/nestjs';
import { GraphQLModule } from '@nestjs/graphql';
import { FeatureModule } from './core/feature.module';
import { ToolingModule } from './infra/tooling.module';
import { baseImports } from 'apps/api/base-module-imports';
import { ConfigModule } from '@nestjs/config';

export interface AppModuleOptions {
  apiType?: 'rest' | 'graphql' | 'all';
}
@Module({})
export class AppModule {
  static forRoot(options: AppModuleOptions = { apiType: 'all' }): DynamicModule {
    const graphqlModule = GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      introspection: true,
      autoSchemaFile: true,
      sortSchema: true,
      context: (ctx) => ctx,
    });
    const imports = [
      FeatureModule.register(options.apiType),
      ToolingModule,
      ConfigModule.forRoot({
        envFilePath: '.env',
        isGlobal: true,
      }),
      ...baseImports,
    ];
    if (options.apiType === 'graphql' || options.apiType === 'all') {
      imports.push(graphqlModule);
    }
    return {
      module: AppModule,
      imports,
      controllers: [AppController],
      providers: [
        {
          provide: 'API_TYPE',
          useValue: options.apiType,
        },
      ],
    };
  }
}
