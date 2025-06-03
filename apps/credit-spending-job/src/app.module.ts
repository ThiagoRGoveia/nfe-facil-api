import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreditSpendingJobService } from './core/credit-spending-job.service';
import { CreditTransactionMikroOrmDbRepositoryProvider } from '@lib/user-credits/core/infra/persistence/db/orm/credit-transaction-mikro-orm-db.repository';
import { UserMikroOrmDbRepositoryProvider } from '@lib/users/core/infra/persistence/db/orm/users-mikro-orm-db.repository';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { dbConfig } from '@lib/database/infra/config/config';
import { SpendCreditsUseCase } from '@lib/user-credits/core/application/use-cases';
import { loggerConfig } from '@lib/commons/infra/configs/logger.config';
import { LoggerModule } from 'nestjs-pino';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      useFactory: loggerConfig,
      inject: [ConfigService],
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: dbConfig,
    }),
  ],
  providers: [
    CreditSpendingJobService,
    SpendCreditsUseCase,
    CreditTransactionMikroOrmDbRepositoryProvider,
    UserMikroOrmDbRepositoryProvider,
    {
      provide: SqlEntityManager,
      useFactory: (em: EntityManager) => em,
      inject: [EntityManager],
    },
  ],
})
export class AppModule {}
