import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentProcessDbPort } from '../ports/document-process-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { DocumentProcess } from '../../domain/entities/document-process.entity';

@Injectable()
export class RemoveFileFromBatchUseCase {
  constructor(
    private readonly documentProcessRepository: DocumentProcessDbPort,
    private readonly fileStoragePort: FileStoragePort,
  ) {}

  async execute(params: { batchId: BatchProcess['id']; documentId: DocumentProcess['id'] }) {
    const document = await this.documentProcessRepository.findById(params.documentId);

    if (!document || document.batchProcess?.id !== params.batchId) {
      throw new BadRequestException('Document not found in batch');
    }

    // Remove from storage
    if (document.filePath) {
      await this.fileStoragePort.delete(document.filePath);
    }

    // Remove from database
    await this.documentProcessRepository.delete(params.documentId);
  }
}
