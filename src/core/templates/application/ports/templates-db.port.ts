import { RequiredEntityData } from '@mikro-orm/core';
import { Template } from '../../domain/entities/template.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { Filter } from '@/infra/dtos/filter.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';

export abstract class TemplateDbPort extends BaseDbPort<Template> {
  abstract findByOwner(
    ownerId: number,
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<Template>>;
  abstract delete(id: number): Promise<void>;
  abstract create(template: RequiredEntityData<Template>): Template;
  abstract update(id: number, template: Partial<RequiredEntityData<Template>>): Template;
}
