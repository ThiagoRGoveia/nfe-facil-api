import { BadRequestException, Injectable } from '@nestjs/common';
import { ProcessFileUseCase } from './process-file.use-case';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { BatchDbPort } from '@lib/documents/core/application/ports/batch-db.port';
import { FileProcessDbPort } from '@lib/documents/core/application/ports/file-process-db.port';
import { CreateBatchDto } from '@lib/documents/core/application/dtos/create-batch.dto';
import { BatchOperationForbiddenError } from '@lib/documents/core/domain/errors/batch-errors';
import { BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { CreateBatchProcessUseCase } from '@lib/documents/core/application/use-cases/create-batch-process.use-case';
import { CancelBatchProcessUseCase } from '@lib/documents/core/application/use-cases/cancel-batch-process.use-case';

@Injectable()
export class SyncFileProcessUseCase {
  private readonly MAX_FILES = 10;
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly processFileUseCase: ProcessFileUseCase,
    private readonly createBatchUseCase: CreateBatchProcessUseCase,
    private readonly cancelBatchUseCase: CancelBatchProcessUseCase,
    private readonly logger: PinoLogger,
  ) {}

  async execute(user: User, dto: CreateBatchDto) {
    // First create the batch process
    const batch = await this.createBatchUseCase.execute(user, dto);
    if (batch.totalFiles > this.MAX_FILES) {
      await this.cancelBatchUseCase.execute(batch.id);
      throw new BadRequestException(`Up to ${this.MAX_FILES} files are allowed to be processed at once`);
    }

    if (batch.status !== BatchStatus.CREATED) {
      await this.cancelBatchUseCase.execute(batch.id);
      throw new BatchOperationForbiddenError('Batch has already been started');
    }

    this.batchRepository.update(batch.id, { status: BatchStatus.PROCESSING });
    await this.batchRepository.save();

    // Get all files for this batch
    const files = await this.fileProcessRepository.findByBatchPaginated(batch.id, this.MAX_FILES, 0);

    // Process files in parallel
    await Promise.all(
      files.map(async (doc) => {
        try {
          await this.processFileUseCase.execute({
            fileId: doc.id,
            shouldConsolidateOutput: dto.consolidateOutput,
          });
        } catch (error) {
          this.logger.error(`Error processing file ${doc.filePath}: %o`, error);
        }
      }),
    );
    this.batchRepository.update(batch.id, { status: BatchStatus.COMPLETED });
    await this.batchRepository.save();
    return this.batchRepository.refresh(batch);
  }
}
