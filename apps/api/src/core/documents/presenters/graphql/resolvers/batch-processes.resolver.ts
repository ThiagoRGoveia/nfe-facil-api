import { Args, Context, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BatchProcess } from '../../../domain/entities/batch-process.entity';
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
import { BadRequestException } from '@nestjs/common';
import { Public } from '@/infra/auth/public.decorator';
import { PublicSyncFileProcessUseCase } from '../../../application/use-cases/public-sync-file-process.use-case';
import { PublicSyncProcessResponse } from '../dtos/public-sync-process.response';
import { CreateBatchProcessUseCase } from '@/core/documents/application/use-cases/create-batch-process.use-case';
import { AsyncBatchProcessUseCase } from '@/core/documents/application/use-cases/async-batch-process.use-case';

const PaginatedBatchProcesses = PaginatedGraphqlResponse(BatchProcess);

@Resolver(() => BatchProcess)
export class BatchProcessesResolver {
  constructor(
    private readonly batchDbPort: BatchDbPort,
    private readonly publicSyncBatchProcessUseCase: PublicSyncFileProcessUseCase,
    private readonly createBatchProcessUseCase: CreateBatchProcessUseCase,
    private readonly asyncBatchProcessUseCase: AsyncBatchProcessUseCase,
  ) {}

  @Query(() => BatchProcess, { nullable: true })
  async findBatchProcessById(@Args('id', { type: () => String }) id: string): Promise<BatchProcess | null> {
    return this.batchDbPort.findByIdOrFail(id);
  }

  @Query(() => PaginatedBatchProcesses)
  async findAllBatchProcesses(
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
  async createBatchProcess(
    @Context() context: GraphqlExpressContext,
    @Args('input') input: CreateBatchInput,
  ): Promise<BatchProcess> {
    const fileBuffers: Array<{ buffer: Buffer; fileName: string }> = [];
    if (input.files) {
      for (const filePromise of input.files) {
        const file = await filePromise;

        const fileName = file.filename.toLowerCase();
        if (!fileName.endsWith('.zip') && !fileName.endsWith('.pdf')) {
          throw new BadRequestException('Invalid file type. Only ZIP and PDF are allowed');
        }

        const buffer = await this.streamToBuffer(file.createReadStream);

        fileBuffers.push({
          buffer,
          fileName: file.filename,
        });
      }
    }

    const batchProcess = await this.createBatchProcessUseCase.execute(context.req.user, {
      templateId: input.templateId,
      files: fileBuffers.map((f) => ({
        data: f.buffer,
        fileName: f.fileName,
      })),
      outputFormats: input.outputFormats,
    });

    await this.asyncBatchProcessUseCase.execute(batchProcess.id);

    return batchProcess;
  }

  @Public()
  @Mutation(() => PublicSyncProcessResponse)
  async publicProcessBatchSync(@Args('input') input: CreateBatchInput) {
    const fileBuffers: Array<{ buffer: Buffer; fileName: string }> = [];

    if (input.files) {
      for (const filePromise of input.files) {
        const file = await filePromise;

        const fileName = file.filename.toLowerCase();
        if (!fileName.endsWith('.zip') && !fileName.endsWith('.pdf')) {
          throw new BadRequestException('Invalid file type. Only ZIP and PDF are allowed');
        }

        const buffer = await this.streamToBuffer(file.createReadStream);

        fileBuffers.push({
          buffer,
          fileName: file.filename,
        });
      }
    }

    const result = await this.publicSyncBatchProcessUseCase.execute({
      templateId: input.templateId,
      outputFormats: input.outputFormats,
      files: fileBuffers.map((f) => ({
        data: f.buffer,
        fileName: f.fileName,
      })),
    });

    return PublicSyncProcessResponse.fromUrls(result);
  }

  @ResolveField(() => User, { nullable: true })
  user(@Parent() batch: BatchProcess): Promise<User | null> {
    return batch.user.load();
  }

  @ResolveField(() => Template, { nullable: true })
  template(@Parent() batch: BatchProcess): Promise<Template | null> {
    return batch.template.load();
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
