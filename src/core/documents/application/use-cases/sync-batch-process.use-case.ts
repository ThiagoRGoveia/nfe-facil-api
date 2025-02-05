import { Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { ProcessDocumentUseCase } from './process-document.use-case';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { FileStatus } from '../../domain/entities/batch-file.entity';
import { CreateBatchProcessUseCase } from './create-batch-process.use-case';
import { User } from '@/core/users/domain/entities/user.entity';
import { CreateBatchDto } from '../dtos/create-batch.dto';

@Injectable()
export class SyncBatchProcessUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly processDocumentUseCase: ProcessDocumentUseCase,
    private readonly createBatchUseCase: CreateBatchProcessUseCase,
  ) {}

  async execute(user: User, dto: CreateBatchDto) {
    // First create the batch process
    const batch = await this.createBatchUseCase.execute(user, dto);

    // Then fetch the full batch with files
    const fullBatch = await this.batchRepository.findByIdWithFiles(batch.id);

    if (fullBatch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Batch has already been started');
    }

    this.batchRepository.update(fullBatch.id, { status: BatchStatus.PROCESSING });
    await this.batchRepository.save();

    // Process files in parallel
    await Promise.all(
      fullBatch.files.map(async (file) => {
        try {
          await this.processDocumentUseCase.execute({
            file: {
              fileName: file.filename,
              filePath: file.storagePath,
            },
            templateId: fullBatch.template.id,
            user,
          });
        } catch (error) {
          // Handle individual file processing errors
          console.error(`Error processing file ${file.storagePath}:`, error);
        }
      }),
    );

    // Update batch status based on results
    const failedFiles = fullBatch.files.filter((f) => f.status === FileStatus.FAILED);
    const newStatus =
      failedFiles.length > 0
        ? failedFiles.length === fullBatch.files.length
          ? BatchStatus.FAILED
          : BatchStatus.PARTIALLY_COMPLETED
        : BatchStatus.COMPLETED;

    this.batchRepository.update(fullBatch.id, { status: newStatus as BatchStatus });
    await this.batchRepository.save();
  }
}
