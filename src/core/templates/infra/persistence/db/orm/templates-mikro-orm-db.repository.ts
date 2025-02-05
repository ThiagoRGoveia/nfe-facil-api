import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { TemplateDbPort } from '@/core/templates/application/ports/templates-db.port';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Filter } from '@/infra/dtos/filter.dto';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { Sort } from '@/infra/dtos/sort.dto';
import { User } from '@/core/users/domain/entities/user.entity';

@Injectable()
export class TemplateMikroOrmDbRepository extends EntityRepository(Template) implements TemplateDbPort {
  findByUser(
    userId: User['id'],
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<Template>> {
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
