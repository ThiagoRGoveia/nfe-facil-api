import { BadRequestException, Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { ProcessFileUseCase } from './process-file.use-case';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { FileProcessStatus } from '../../domain/entities/file-process.entity';
import { CreateBatchProcessUseCase } from './create-batch-process.use-case';
import { User } from '@/core/users/domain/entities/user.entity';
import { CreateBatchDto } from '../dtos/create-batch.dto';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { CancelBatchProcessUseCase } from './cancel-batch-process.use-case';

@Injectable()
export class SyncBatchProcessUseCase {
  private readonly MAX_FILES = 10;
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly processFileUseCase: ProcessFileUseCase,
    private readonly createBatchUseCase: CreateBatchProcessUseCase,
    private readonly cancelBatchUseCase: CancelBatchProcessUseCase,
  ) {}

  async execute(user: User, dto: CreateBatchDto) {
    // First create the batch process
    const batch = await this.createBatchUseCase.execute(user, dto);

    if (batch.totalFiles > this.MAX_FILES) {
      throw new BadRequestException('Up to 10 files are allowed to be processed at once');
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
            file: doc,
            user,
          });
        } catch (error) {
          // Handle individual file processing errors
          console.error(`Error processing file ${doc.filePath}:`, error);
        }
      }),
    );

    // Update batch status based on results
    const failedDocs = await this.fileProcessRepository.countByBatchAndStatus(batch.id, FileProcessStatus.FAILED);
    const totalDocs = files.length;

    const newStatus =
      failedDocs > 0
        ? failedDocs === totalDocs
          ? BatchStatus.FAILED
          : BatchStatus.PARTIALLY_COMPLETED
        : BatchStatus.COMPLETED;

    this.batchRepository.update(batch.id, { status: newStatus });
    await this.batchRepository.save();
  }
}
