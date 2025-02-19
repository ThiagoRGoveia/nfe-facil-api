import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { FileToProcess } from '../../../domain/entities/file-process.entity';
import { FileProcessDbPort } from '../../../application/ports/file-process-db.port';
import { GraphqlExpressContext } from '@/infra/graphql/types/context.type';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@/infra/graphql/factories/paginated-response.factory';
import { Filters } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { UserRole } from '@/core/users/domain/entities/user.entity';

const PaginatedFiles = PaginatedGraphqlResponse(FileToProcess);

@Resolver(() => FileToProcess)
export class FilesResolver {
  constructor(private readonly fileProcessDbPort: FileProcessDbPort) {}

  @Query(() => PaginatedFiles)
  findAllFiles(
    @Context() context: GraphqlExpressContext,
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponse<FileToProcess>> {
    if (context.req.user.role === UserRole.ADMIN) {
      return this.fileProcessDbPort.findAll(filters?.filters, pagination, sort);
    } else {
      return this.fileProcessDbPort.findByUser(context.req.user.id, filters?.filters, pagination, sort);
    }
  }
}
