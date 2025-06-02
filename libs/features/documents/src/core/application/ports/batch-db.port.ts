import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';
import { Pagination } from '@lib/commons/dtos/pagination.dto';
import { Sort } from '@lib/commons/dtos/sort.dto';
import { Filter } from '@lib/commons/dtos/filter.dto';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
@Injectable()
export abstract class BatchDbPort extends BaseDbPort<BatchProcess> {
  abstract incrementProcessedFilesCount(id: BatchProcess['id']): Promise<BatchProcess>;
  abstract findByUser(
    userId: string,
    filters?: Filter[],
    pagination?: Pagination,
    sort?: Sort,
  ): Promise<PaginatedResponse<BatchProcess>>;
}
