import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookDispatchJobService } from './core/services/webhook-dispatch-job.service';
import { HttpClientPort } from '@lib/webhook-dispatcher/core/application/ports/http-client.port';
import { EncryptionAdapter } from 'libs/tooling/encryption/src/core/adapters/encryption.adapter';
import { EncryptionPort } from 'libs/tooling/encryption/src/core/ports/encryption.port';
import { WebhookDispatcherService } from './core/services/webhook-dispatcher.service';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/core';
import { HttpClientAdapter } from '@lib/webhook-dispatcher/core/infra/adapters/http-client.adapter';
import { WebhookDeliveryMikroOrmDbRepository } from '@lib/webhook-dispatcher/core/infra/persistence/db/orm/webhook-delivery-mikro-orm-db.repository';
import { WebhookDeliveryDbPort } from '@lib/webhook-dispatcher/core/application/ports/webhook-delivery-db.port';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
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
