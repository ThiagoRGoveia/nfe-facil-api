import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OutputConsolidationJobService } from './core/output-consolidation-job.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from '@lib/commons/infra/configs/logger.config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { dbConfig } from '@lib/database/infra/config/config';
import { ExcelLibModule } from '@lib/excel';
import { CsvModule } from '@lib/csv';
import { BatchMikroOrmRepositoryProvider } from '@lib/documents/core/infra/persistence/db/orm/batch-process-mikro-orm-db.repository';
import { FileStorageLibModule } from '@lib/file-storage';
import { FileProcessMikroOrmDbRepositoryProvider } from '@lib/documents/core/infra/persistence/db/orm/file-process-mikro-orm-db.repository';
import { HandleOutputFormatUseCase } from '@lib/documents/core/application/use-cases/handle-output-format.use-case';
import { MikroOrmLambdaCompatibilityConfig } from '@lib/commons/infra/configs/mikro-orm-lambda-compatibility.config';

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
    ExcelLibModule,
    CsvModule,
    FileStorageLibModule,
  ],
  providers: [
    OutputConsolidationJobService,
    HandleOutputFormatUseCase,
    BatchMikroOrmRepositoryProvider,
    FileProcessMikroOrmDbRepositoryProvider,
    MikroOrmLambdaCompatibilityConfig,
  ],
})
export class AppModule {}
