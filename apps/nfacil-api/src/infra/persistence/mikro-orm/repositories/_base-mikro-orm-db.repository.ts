import * as _ from 'lodash';
import {
  EntityClass,
  EntityManager,
  FilterQuery,
  MikroORM,
  OrderDefinition,
  QueryOrder,
  ReferenceKind,
  RequiredEntityData,
} from '@mikro-orm/postgresql';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { Sort } from '@/infra/dtos/sort.dto';
import { Filter } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { Ref } from '@mikro-orm/core';
import { User } from '@/core/users/domain/entities/user.entity';
export function EntityRepository<T>(entity: EntityClass<T>) {
  @Injectable()
  class Repository extends BaseMikroOrmDbRepository<T extends { id: string | number } ? T : never, typeof entity> {
    constructor(em: EntityManager, orm: MikroORM) {
      super(em, orm);
      this.entity = entity;
    }
  }

  return Repository;
}

export class BaseMikroOrmDbRepository<T extends { id: string | number }, S> implements BaseDbPort<T> {
  public entity: S extends EntityClass<S> ? S : EntityClass<S>;
  public em: EntityManager;
  public orm: MikroORM;

  constructor(em: EntityManager, orm: MikroORM) {
    this.em = em;
    this.orm = orm;
  }

  async save(): Promise<void> {
    await this.em.flush();
  }

  findById(id: T['id']): Promise<T | null> {
    return this.em.findOne(this.entity, { id });
  }

  async findByIdOrFail(id: T['id']): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`${this.entity.name} not found`);
    }
    return entity;
  }

  async findAll(
    filters?: Filter[],
    pagination: Pagination = { pageSize: 20, page: 1 },
    sort?: Sort,
    all = false,
  ): Promise<PaginatedResponse<T>> {
    let sortQuery: OrderDefinition<T> = {};

    let filterQuery: FilterQuery<T> = {};

    if (this.isSortValid(sort)) {
      sortQuery = this.buildSort(sort);
    }

    if (filters) {
      for (const filter of filters) {
        if (this.isFilterValid(filter)) {
          // filterQuery = { ...filterQuery, ...this.buildFilter(filter) };
          const builtFilter = this.buildFilter(filter);
          filterQuery = { ...filterQuery, ...(builtFilter as object) };
        }
      }
    }

    const response = await this.em.findAndCount(this.entity, filterQuery, {
      limit: !all ? pagination?.pageSize : undefined,
      offset: !all ? (pagination.page - 1) * pagination?.pageSize : undefined,
      orderBy: sortQuery,
    });
    return {
      items: response[0],
      total: response[1],
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(response[1] / pagination.pageSize),
    };
  }

  setToBeDeleted(id: T['id']): void {
    this.em.remove(this.em.getReference(this.entity, id));
  }

  async exists(id: T['id']): Promise<boolean> {
    const entity = await this.em.findOne(this.entity, id, { fields: ['id'] });
    return !!entity;
  }

  async allExist(ids: T['id'][]): Promise<boolean> {
    const entities = await this.em.find(this.entity, { id: { $in: ids } }, { fields: ['id'] });
    return entities.length === ids.length;
  }

  async delete(id: T['id']): Promise<void> {
    await this.em.removeAndFlush(this.em.getReference(this.entity, id));
  }

  create(data: RequiredEntityData<T>): T {
    return this.em.create(this.entity, data);
  }

  update(id: T['id'], data: Partial<RequiredEntityData<T>>): T {
    const existingFile = this.em.getReference(this.entity, id);
    // @ts-expect-error: data is a partial of the entity
    this.em.assign(existingFile, data);
    return existingFile;
  }

  ref(id: T['id']): Ref<T> {
    return this.em.getReference(this.entity, id);
  }

  findByUser(
    userId: User['id'],
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<T>> {
    const allFilters = [...(filters || [])];
    const ownerFilter = allFilters.find((filter) => filter.field === 'user.id');
    if (ownerFilter) {
      ownerFilter.value = userId.toString();
    } else {
      allFilters.push({ field: 'user.id', value: userId.toString() });
    }
    return this.findAll(allFilters, pagination, sort);
  }

  isSortValid(sort?: Sort): sort is Sort {
    return (
      !!sort &&
      'field' in sort &&
      'direction' in sort &&
      this.hasNestedProperty(this.entity.name, sort.field) &&
      sort.direction in QueryOrder
    );
  }

  isFilterValid(filter?: Filter): filter is Filter {
    return (
      !!filter &&
      !!filter.field &&
      (!!filter.value || !!filter.range || !!filter.in || !!filter.ilike) &&
      this.hasNestedProperty(this.entity.name, filter.field)
    );
  }

  buildSort(sort: Sort): OrderDefinition<T> {
    return _.set({}, sort.field, sort.direction);
  }

  buildFilter(filter: Filter): FilterQuery<T> {
    if (filter.field) {
      if (filter.value) {
        if (filter.not) {
          return _.set({}, filter.field, { $ne: filter.value });
        }
        return _.set({}, filter.field, filter.value);
      }
      if (filter.range) {
        if (filter.not) {
          return _.set({}, filter.field, {
            $not: { $gte: filter.range[0], $lte: filter.range[1] },
          });
        }
        return _.set({}, filter.field, {
          $gte: filter.range[0],
          $lte: filter.range[1],
        });
      }
      if (filter.in) {
        if (filter.not) {
          return _.set({}, filter.field, { $nin: filter.in });
        }
        return _.set({}, filter.field, { $in: filter.in });
      }

      if (filter.ilike) {
        if (filter.not) {
          return _.set({}, filter.field, {
            $not: { $ilike: `%${filter.ilike}%` },
          });
        }
        return _.set({}, filter.field, { $ilike: `%${filter.ilike}%` });
      }
    }
    return {};
  }

  hasNestedProperty(cls: string, path: string) {
    if (!this.orm) {
      throw new Error('ORM not initialized, please make sure MikroORM is available in the repository context.');
    }

    const pathArray = path.split('.');
    let entityMetadata = this.orm.getMetadata().get(cls);

    for (const key of pathArray) {
      if (!(key in entityMetadata.properties)) {
        return false;
      }
      if (key === pathArray[pathArray.length - 1]) {
        if (entityMetadata.properties[key].kind === ReferenceKind.SCALAR) {
          return true;
        } else {
          return false;
        }
      }
      try {
        entityMetadata = this.orm.getMetadata().get(entityMetadata.properties[key].type);
      } catch {
        return false;
      }
    }
    return false;
  }
}
