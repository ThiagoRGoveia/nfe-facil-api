import { Filter } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';

export abstract class BaseDbPort<T = unknown> {
  /**
   * Persists the current state of the entity to the database
   * @returns A promise that resolves when the save operation is complete
   */
  abstract save(): Promise<void>;

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
  abstract findById(id: number): Promise<T | null>;

  /**
   * Retrieves a single entity by its ID
   * @param id - The unique identifier of the entity
   * @returns A promise that resolves to the entity if found, or null if not found
   */
  abstract findByIdOrFail(id: number): Promise<T>;

  /**
   * Checks if an entity with the specified ID exists
   * @param id - The unique identifier to check
   * @returns A promise that resolves to true if the entity exists, false otherwise
   */
  abstract exists(id: number): Promise<boolean>;

  /**
   * Verifies that all provided IDs correspond to existing entities
   * @param ids - Array of entity IDs to check
   * @returns A promise that resolves to true if all entities exist, false if any are missing
   */
  abstract allExist(ids: number[]): Promise<boolean>;

  /**
   * Permanently removes an entity from the database
   * @param id - The unique identifier of the entity to delete
   * @returns A promise that resolves when the deletion is complete
   */
  abstract delete(id: number): Promise<void>;

  /**
   * Marks an entity for deletion in the next database operation batch
   * @param ids - The ID of the entity to be marked for deletion
   */
  abstract setToBeDeleted(ids: number): void;
}
