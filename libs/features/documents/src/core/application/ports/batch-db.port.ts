import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { Filter } from '@/infra/dtos/filter.dto';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
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
