import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

interface AppModuleOptions {
  apiType: 'rest' | 'graphql';
}

@Module({})
export class AppModule {
  static forRoot(options: AppModuleOptions): DynamicModule {
    console.log(`Initializing ${options.apiType} API`);

    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        LoggerModule.forRoot(),
      ],
    };
  }
}
