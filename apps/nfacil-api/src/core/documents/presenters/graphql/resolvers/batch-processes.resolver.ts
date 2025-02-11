import { Args, Context, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BatchProcess } from '../../../domain/entities/batch-process.entity';
import { SyncBatchProcessUseCase } from '../../../application/use-cases/sync-batch-process.use-case';
import { BatchDbPort } from '../../../application/ports/batch-db.port';
import { GraphqlExpressContext } from '@/infra/graphql/types/context.type';
import { CreateBatchInput } from '../dtos/create-batch.input';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@/infra/graphql/factories/paginated-response.factory';
import { Filters } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { FileToProcess } from '../../../domain/entities/file-process.entity';
import { BadRequestException } from '@nestjs/common';

const PaginatedBatchProcesses = PaginatedGraphqlResponse(BatchProcess);

@Resolver(() => BatchProcess)
export class BatchProcessesResolver {
  constructor(
    private readonly batchDbPort: BatchDbPort,
    private readonly syncBatchProcessUseCase: SyncBatchProcessUseCase,
  ) {}

  @Query(() => BatchProcess, { nullable: true })
  async findBatchProcessById(@Args('id', { type: () => String }) id: string): Promise<BatchProcess | null> {
    return this.batchDbPort.findByIdOrFail(id);
  }

  @Query(() => PaginatedBatchProcesses)
  findAllBatchProcesses(
    @Context() context: GraphqlExpressContext,
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponse<BatchProcess>> {
    if (context.req.user.role === UserRole.ADMIN) {
      return this.batchDbPort.findAll(filters?.filters, pagination, sort);
    } else {
      return this.batchDbPort.findByUser(context.req.user.id, filters?.filters, pagination, sort);
    }
  }

  @Mutation(() => BatchProcess)
  async processBatchSync(
    @Context() context: GraphqlExpressContext,
    @Args('input') input: CreateBatchInput,
  ): Promise<BatchProcess> {
    const file = await input.file;
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const buffer = await this.streamToBuffer(file.createReadStream);

    return this.syncBatchProcessUseCase.execute(context.req.user, {
      templateId: input.templateId,
      file: buffer,
      fileName: file.filename,
    });
  }

  @ResolveField(() => User, { nullable: true })
  user(@Parent() batch: BatchProcess): Promise<User | null> {
    return batch.user.load();
  }

  @ResolveField(() => Template, { nullable: true })
  template(@Parent() batch: BatchProcess): Promise<Template | null> {
    return batch.template.load();
  }

  @ResolveField(() => [FileToProcess])
  async files(@Parent() batch: BatchProcess): Promise<FileToProcess[]> {
    const a = await batch.files.loadItems();
    return a;
  }

  private async streamToBuffer(stream: () => NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const readStream = stream();

    return new Promise((resolve, reject) => {
      readStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      readStream.on('end', () => resolve(Buffer.concat(chunks)));
      readStream.on('error', reject);
    });
  }
}
