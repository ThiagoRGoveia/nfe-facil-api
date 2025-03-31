import { User } from '@/core/users/domain/entities/user.entity';
import { Filter } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { Ref, RequiredEntityData } from '@mikro-orm/core';

export abstract class BaseDbPort<T extends { id: string | number }> {
  /**
   * Persists the current state of the entity to the database
   * @returns A promise that resolves when the save operation is complete
   */
  abstract save(): Promise<void>;

  abstract commit(): Promise<void>;

  /**
   * Retrieves all entities matching the specified criteria
   * @param filter - Optional array of filters to apply to the query
   * @param pagination - Optional pagination parameters
   * @param sort - Optional sorting criteria
   * @returns A promise that resolves to a paginated response containing the matching entities
   */
  abstract findAll(filter?: Filter[], pagination?: Pagination, sort?: Sort): Promise<PaginatedResponse<T>>;

  /**
   * Retrieves a single entity by its ID
   * @param id - The unique identifier of the entity
   * @returns A promise that resolves to the entity if found, or null if not found
   */
  abstract findById(id: T['id']): Promise<T | null>;

  /**
   * Retrieves a single entity by its ID
   * @param id - The unique identifier of the entity
   * @returns A promise that resolves to the entity if found, or null if not found
   */
  abstract findByIdOrFail(id: T['id']): Promise<T>;

  /**
   * Checks if an entity with the specified ID exists
   * @param id - The unique identifier to check
   * @returns A promise that resolves to true if the entity exists, false otherwise
   */
  abstract exists(id: T['id']): Promise<boolean>;

  /**
   * Verifies that all provided IDs correspond to existing entities
   * @param ids - Array of entity IDs to check
   * @returns A promise that resolves to true if all entities exist, false if any are missing
   */
  abstract allExist(ids: T['id'][]): Promise<boolean>;

  /**
   * Permanently removes an entity from the database
   * @param id - The unique identifier of the entity to delete
   * @returns A promise that resolves when the deletion is complete
   */
  abstract delete(id: T['id']): Promise<void>;

  /**
   * Marks an entity for deletion in the next database operation batch
   * @param ids - The ID of the entity to be marked for deletion
   */
  abstract setToBeDeleted(ids: T['id']): void;

  /**
   * Creates a new entity
   * @param data - The data to create the entity with
   * @returns The created entity
   */
  abstract create(data: RequiredEntityData<T>): T;

  /**
   * Updates an existing entity
   * @param id - The unique identifier of the entity to update
   * @param data - The data to update the entity with
   * @returns The updated entity
   */
  abstract update(id: T['id'], data: Partial<RequiredEntityData<T>>): T;

  /**
   * Retrieves a reference to an entity by its ID
   * @param id - The unique identifier of the entity
   * @returns A reference to the entity
   */
  abstract ref(id: T['id']): Ref<T>;

  /**
   * Retrieves entities by user ID
   * @param userId - The ID of the user to filter by
   * @param filters - Optional filters to apply to the query
   * @param pagination - Optional pagination parameters
   * @param sort - Optional sorting criteria
   */
  abstract findByUser(
    userId: User['id'],
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<T>>;

  abstract refresh(entity: T): Promise<T>;
}
