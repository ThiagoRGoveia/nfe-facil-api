import { BadRequestException, Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchFileDbPort } from '../ports/batch-file-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { BatchFile } from '../../domain/entities/batch-file.entity';
import { BatchProcess } from '../../domain/entities/batch-process.entity';

@Injectable()
export class RemoveFileFromBatchUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileRepository: BatchFileDbPort,
    private readonly fileStoragePort: FileStoragePort,
  ) {}

  async execute(params: { batchId: BatchProcess['id']; fileId: BatchFile['id'] }) {
    const batch = await this.batchRepository.findByIdWithFiles(params.batchId);
    const file = batch.files.find((f) => f.id === params.fileId);

    if (!file) {
      throw new BadRequestException('File not found in batch');
    }

    // Remove from storage
    await this.fileStoragePort.delete(file.storagePath);

    // Remove from database
    await this.fileRepository.delete(params.fileId);
    await this.batchRepository.removeFileFromBatch(params.batchId, params.fileId);
  }
}
