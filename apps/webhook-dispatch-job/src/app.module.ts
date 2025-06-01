import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookDispatchJobService } from './core/services/webhook-dispatch-job.service';
import { baseImports } from 'apps/api/base-module-imports';
import { HttpClientPort } from '@/core/webhooks/application/ports/http-client.port';
import { HttpClientAdapter } from '@/core/webhooks/infra/adapters/http-client.adapter';
import { EncryptionAdapter } from 'libs/tooling/encryption/src/core/adapters/encryption.adapter';
import { EncryptionPort } from 'libs/tooling/encryption/src/core/ports/encryption.port';
import { WebhookDeliveryDbPort } from '@/core/webhooks/webhooks.module';
import { WebhookDeliveryMikroOrmDbRepository } from '@/core/webhooks/infra/persistence/db/orm/webhook-delivery-mikro-orm-db.repository';
import { WebhookDispatcherService } from './core/services/webhook-dispatcher.service';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ...baseImports,
  ],
  providers: [
    WebhookDispatchJobService,
    WebhookDispatcherService,
    {
      provide: WebhookDeliveryDbPort,
      useClass: WebhookDeliveryMikroOrmDbRepository,
    },
    {
      provide: HttpClientPort,
      useClass: HttpClientAdapter,
    },
    {
      provide: EncryptionPort,
      useClass: EncryptionAdapter,
    },
    {
      provide: SqlEntityManager,
      useFactory: (em: EntityManager) => em,
      inject: [EntityManager],
    },
  ],
  exports: [SqlEntityManager],
})
export class AppModule {}
