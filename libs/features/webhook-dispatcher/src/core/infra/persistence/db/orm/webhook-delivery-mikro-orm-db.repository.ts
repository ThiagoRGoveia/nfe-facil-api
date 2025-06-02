import { RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@lib/database/infra/persistence/repositories/_base-mikro-orm-db.repository';
import { WebhookDelivery, WebhookDeliveryStatus } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';
import { DatePort } from '@lib/date/core/date.adapter';
import { WebhookDeliveryDbPort } from '@lib/webhook-dispatcher/core/application/ports/webhook-delivery-db.port';

@Injectable()
export class WebhookDeliveryMikroOrmDbRepository
  extends EntityRepository(WebhookDelivery)
  implements WebhookDeliveryDbPort
{
  async findPendingDeliveries(): Promise<WebhookDelivery[]> {
    return this.em.find(WebhookDelivery, {
      status: { $in: [WebhookDeliveryStatus.PENDING, WebhookDeliveryStatus.RETRY_PENDING] },
      nextAttempt: { $lte: DatePort.now() },
    });
  }

  create(delivery: RequiredEntityData<WebhookDelivery>): WebhookDelivery {
    const newDelivery = this.em.create(WebhookDelivery, delivery);
    this.em.persist(newDelivery);
    return newDelivery;
  }

  update(id: WebhookDelivery['id'], delivery: Partial<RequiredEntityData<WebhookDelivery>>): WebhookDelivery {
    const existingDelivery = this.em.getReference(WebhookDelivery, id);
    this.em.assign(existingDelivery, delivery);
    return existingDelivery;
  }
}
