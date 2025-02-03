import { RequiredEntityData } from '@mikro-orm/core';
import { Template } from '../../domain/entities/template.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { Filter } from '@/infra/dtos/filter.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { User } from '@/core/users/domain/entities/user.entity';

export abstract class TemplateDbPort extends BaseDbPort<Template> {
  abstract findByOwner(
    ownerId: User['id'],
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<Template>>;
  abstract delete(id: Template['id']): Promise<void>;
  abstract create(template: RequiredEntityData<Template>): Template;
  abstract update(id: Template['id'], template: Partial<RequiredEntityData<Template>>): Template;
}
