import { RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { WebhookDbPort } from '@/core/webhooks/application/ports/webhook-db.port';
import { Webhook, WebhookEvent, WebhookStatus } from '@/core/webhooks/domain/entities/webhook.entity';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { Filter } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { User } from '@lib/users/core/domain/entities/user.entity';

@Injectable()
export class WebhookMikroOrmDbRepository extends EntityRepository(Webhook) implements WebhookDbPort {
  async findActiveByEventAndUser(event: WebhookEvent, user: User): Promise<Webhook[]> {
    return this.em.find(Webhook, {
      events: { $contains: [event] },
      status: WebhookStatus.ACTIVE,
      user,
    });
  }

  create(webhook: RequiredEntityData<Webhook>): Webhook {
    const newWebhook = this.em.create(Webhook, webhook);
    this.em.persist(newWebhook);
    return newWebhook;
  }

  update(id: Webhook['id'], webhook: Partial<RequiredEntityData<Webhook>>): Webhook {
    const existingWebhook = this.em.getReference(Webhook, id);
    this.em.assign(existingWebhook, webhook);
    return existingWebhook;
  }

  async findByUser(
    userId: string,
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<Webhook>> {
    const allFilters = [...(filters || [])];
    const ownerFilter = allFilters.find((filter) => filter.field === 'user.id');
    if (ownerFilter) {
      ownerFilter.value = userId.toString();
    } else {
      allFilters.push({ field: 'user.id', value: userId.toString() });
    }
    return super.findAll(allFilters, pagination, sort);
  }
}
