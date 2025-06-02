import { BadRequestException, Injectable } from '@nestjs/common';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { FileRecord } from '../../domain/entities/file-records.entity';

@Injectable()
export class RemoveFileFromBatchUseCase {
  constructor(
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly fileStoragePort: FileStoragePort,
  ) {}

  async execute(params: { batchId: BatchProcess['id']; fileId: FileRecord['id'] }) {
    const file = await this.fileProcessRepository.findById(params.fileId);

    if (!file || file.batchProcess?.id !== params.batchId) {
      throw new BadRequestException('File not found in batch');
    }

    // Remove from storage
    if (file.filePath) {
      await this.fileStoragePort.delete(file.filePath);
    }

    // Remove from database
    await this.fileProcessRepository.delete(params.fileId);
  }
}
