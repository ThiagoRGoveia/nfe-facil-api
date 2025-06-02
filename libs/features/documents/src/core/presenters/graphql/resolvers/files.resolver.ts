import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { FileRecord } from '../../../domain/entities/file-records.entity';
import { FileProcessDbPort } from '../../../application/ports/file-process-db.port';
import { GraphqlExpressContext } from '@/infra/graphql/types/context.type';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@/infra/graphql/factories/paginated-response.factory';
import { Filters } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { ProcessFileUseCase } from '../../../application/use-cases/process-file.use-case';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
const PaginatedFiles = PaginatedGraphqlResponse(FileRecord);

@Resolver(() => FileRecord)
export class FilesResolver {
  constructor(
    private readonly fileProcessDbPort: FileProcessDbPort,
    private readonly configService: ConfigService,
    private readonly processFileUseCase: ProcessFileUseCase,
    private readonly fileStorage: FileStoragePort,
  ) {}

  @Query(() => PaginatedFiles)
  findAllFiles(
    @Context() context: GraphqlExpressContext,
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponse<FileRecord>> {
    if (context.req.user.role === UserRole.ADMIN) {
      return this.fileProcessDbPort.findAll(filters?.filters, pagination, sort);
    } else {
      return this.fileProcessDbPort.findByUser(context.req.user.id, filters?.filters, pagination, sort);
    }
  }

  @Mutation(() => FileRecord)
  async processFile(@Args('fileId', { type: () => String }) fileId: string): Promise<FileRecord> {
    return this.processFileUseCase.execute({ fileId });
  }

  @ResolveField(() => String, { nullable: true })
  async filePath(@Parent() file: FileRecord) {
    if (!file.filePath) {
      return null;
    }
    return this.fileStorage.createSignedUrl(file.filePath);
  }
}
