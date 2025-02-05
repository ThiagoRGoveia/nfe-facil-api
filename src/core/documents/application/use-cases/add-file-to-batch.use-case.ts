import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchFileDbPort } from '../ports/batch-file-db.port';
import { FileStatus } from '../../domain/entities/batch-file.entity';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { User } from '@/core/users/domain/entities/user.entity';
import { Readable } from 'stream';

@Injectable()
export class AddFileToBatchUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileRepository: BatchFileDbPort,
    private readonly fileStoragePort: FileStoragePort,
    private readonly uuidAdapter: UuidAdapter,
  ) {}

  async execute(params: { batchId: string; file: Readable; filename: string; mimetype: string; user: User }) {
    const batch = await this.batchRepository.findById(params.batchId);

    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    let filePath: string;
    try {
      filePath = await this.fileStoragePort.uploadFromStream(
        `uploads/${params.user.id}/batch/${batch.id}/${this.uuidAdapter.generate()}`,
        params.file,
        params.mimetype,
      );
    } catch (uploadError) {
      if (uploadError instanceof HttpException) {
        throw uploadError;
      }
      throw new BadRequestException('Failed to store document');
    }

    const file = this.fileRepository.create({
      filename: params.filename,
      status: FileStatus.PENDING,
      storagePath: filePath,
      batchProcess: batch,
    });

    // Add to batch
    try {
      await this.batchRepository.addFileToBatch(params.batchId, file);
      await this.batchRepository.save();
    } catch (error) {
      await this.fileStoragePort.delete(filePath);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to add file to batch');
    }
    return file;
  }
}
