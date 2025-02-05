import { Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { ProcessDocumentUseCase } from './process-document.use-case';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { DocumentProcessStatus } from '../../domain/entities/document-process.entity';
import { CreateBatchProcessUseCase } from './create-batch-process.use-case';
import { User } from '@/core/users/domain/entities/user.entity';
import { CreateBatchDto } from '../dtos/create-batch.dto';
import { DocumentProcessDbPort } from '../ports/document-process-db.port';

@Injectable()
export class SyncBatchProcessUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly documentProcessRepository: DocumentProcessDbPort,
    private readonly processDocumentUseCase: ProcessDocumentUseCase,
    private readonly createBatchUseCase: CreateBatchProcessUseCase,
  ) {}

  async execute(user: User, dto: CreateBatchDto) {
    // First create the batch process
    const batch = await this.createBatchUseCase.execute(user, dto);

    if (batch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Batch has already been started');
    }

    this.batchRepository.update(batch.id, { status: BatchStatus.PROCESSING });
    await this.batchRepository.save();

    // Get all documents for this batch
    const documents = await this.documentProcessRepository.findByBatchPaginated(batch.id, 10, 0);

    // Process files in parallel
    await Promise.all(
      documents.map(async (doc) => {
        try {
          await this.processDocumentUseCase.execute({
            file: {
              fileName: doc.fileName,
              filePath: doc.filePath!,
            },
            templateId: batch.template.id,
            user,
            batchId: batch.id,
          });
        } catch (error) {
          // Handle individual file processing errors
          console.error(`Error processing file ${doc.filePath}:`, error);
        }
      }),
    );

    // Update batch status based on results
    const failedDocs = await this.documentProcessRepository.countByBatchAndStatus(
      batch.id,
      DocumentProcessStatus.FAILED,
    );
    const totalDocs = documents.length;

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
