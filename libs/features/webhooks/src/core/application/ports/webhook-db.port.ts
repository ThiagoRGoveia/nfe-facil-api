import { Injectable } from '@nestjs/common';
import { Webhook } from '../../domain/entities/webhook.entity';
import { WebhookEvent } from '../../domain/entities/webhook.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';
import { RequiredEntityData } from '@mikro-orm/core';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { Filter } from '@lib/commons/dtos/filter.dto';
import { Pagination } from '@lib/commons/dtos/pagination.dto';
import { Sort } from '@lib/commons/dtos/sort.dto';
import { User } from '@lib/users/core/domain/entities/user.entity';

@Injectable()
export abstract class WebhookDbPort extends BaseDbPort<Webhook> {
  abstract findActiveByEventAndUser(event: WebhookEvent, user: User): Promise<Webhook[]>;
  abstract create(data: RequiredEntityData<Webhook>): Webhook;
  abstract update(id: Webhook['id'], data: Partial<RequiredEntityData<Webhook>>): Webhook;
  abstract findByUser(
    userId: string,
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<Webhook>>;
}
