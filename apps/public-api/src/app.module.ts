import { Module } from '@nestjs/common';
import { FeatureModule } from './core/feature.module';
import { ToolingModule } from './infra/tooling.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from '../app.controller';
import { dbConfig } from '@lib/database/infra/config/config';

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
      useFactory: dbConfig,
    }),
    FeatureModule,
    ToolingModule,
  ],
  controllers: [AppController],
  exports: [],
})
export class AppModule {}
