import { BadRequestException, Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { ProcessFileUseCase } from './process-file.use-case';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { CreateBatchProcessUseCase } from './create-batch-process.use-case';
import { User } from '@/core/users/domain/entities/user.entity';
import { CreateBatchDto } from '../dtos/create-batch.dto';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { CancelBatchProcessUseCase } from './cancel-batch-process.use-case';
import { PinoLogger } from 'nestjs-pino';

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
