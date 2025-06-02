import { Args, Context, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BatchProcess } from '../../../domain/entities/batch-process.entity';
import { BatchDbPort } from '../../../application/ports/batch-db.port';
import { GraphqlExpressContext } from '@lib/commons/graphql/types/context.type';
import { CreateBatchInput } from '../dtos/create-batch.input';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@lib/commons/graphql/factories/paginated-response.factory';
import { Filters } from '@lib/commons/dtos/filter.dto';
import { Pagination } from '@lib/commons/dtos/pagination.dto';
import { Sort } from '@lib/commons/dtos/sort.dto';
import { User, UserRole } from '@lib/users/core/domain/entities/user.entity';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { BadRequestException } from '@nestjs/common';
import { CreateBatchProcessUseCase } from '@lib/documents/core/application/use-cases/create-batch-process.use-case';
import { AsyncBatchProcessUseCase } from '@lib/documents/core/application/use-cases/async-batch-process.use-case';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { TriggerOutputConsolidationUseCase } from '@lib/documents/core/application/use-cases/trigger-output-consolidation.use-case';
const PaginatedBatchProcesses = PaginatedGraphqlResponse(BatchProcess);

@Resolver(() => BatchProcess)
export class BatchProcessesResolver {
  constructor(
    private readonly batchDbPort: BatchDbPort,
    private readonly createBatchProcessUseCase: CreateBatchProcessUseCase,
    private readonly asyncBatchProcessUseCase: AsyncBatchProcessUseCase,
    private readonly fileStorage: FileStoragePort,
    private readonly triggerOutputConsolidationUseCase: TriggerOutputConsolidationUseCase,
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

  @Mutation(() => BatchProcess)
  async processBatch(@Args('batchId', { type: () => String }) batchId: string): Promise<BatchProcess> {
    await this.asyncBatchProcessUseCase.execute(batchId);
    return this.batchDbPort.findByIdOrFail(batchId);
  }

  @Mutation(() => BatchProcess)
  async processOutputConsolidation(@Args('batchId', { type: () => String }) batchId: string): Promise<BatchProcess> {
    return this.triggerOutputConsolidationUseCase.execute(batchId);
  }

  @ResolveField(() => User, { nullable: true })
  user(@Parent() batch: BatchProcess): Promise<User | null> {
    return batch.user.load();
  }

  @ResolveField(() => Template, { nullable: true })
  template(@Parent() batch: BatchProcess): Promise<Template | null> {
    return batch.template.load();
  }

  @ResolveField(() => String, { nullable: true })
  jsonResults(@Parent() batch: BatchProcess) {
    if (!batch.jsonResults) {
      return null;
    }
    return this.fileStorage.createSignedUrl(batch.jsonResults);
  }

  @ResolveField(() => String, { nullable: true })
  csvResults(@Parent() batch: BatchProcess) {
    if (!batch.csvResults) {
      return null;
    }
    return this.fileStorage.createSignedUrl(batch.csvResults);
  }

  @ResolveField(() => String, { nullable: true })
  excelResults(@Parent() batch: BatchProcess) {
    if (!batch.excelResults) {
      return null;
    }
    return this.fileStorage.createSignedUrl(batch.excelResults);
  }

  @ResolveField(() => String)
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
