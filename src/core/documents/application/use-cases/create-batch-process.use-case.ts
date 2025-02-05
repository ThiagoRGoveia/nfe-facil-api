import { Injectable } from '@nestjs/common';
import { BatchProcess, BatchStatus } from '../../domain/entities/batch-process.entity';
import { TemplateDbPort } from '@/core/templates/application/ports/templates-db.port';
import { User } from '@/core/users/domain/entities/user.entity';
import { CreateBatchDto } from '../dtos/create-batch.dto';
import { BadRequestException } from '@nestjs/common';
import { ZipPort } from '../ports/zip.port';
import { BatchDbPort } from '../ports/batch-db.port';
import { FileStatus } from '../../domain/entities/batch-file.entity';
import { BatchFileDbPort } from '../ports/batch-file-db.port';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';

@Injectable()
export class CreateBatchProcessUseCase {
  constructor(
    private readonly batchProcessRepository: BatchDbPort,
    private readonly templateRepository: TemplateDbPort,
    private readonly fileRepository: BatchFileDbPort,
    private readonly fileStorage: FileStoragePort,
    private readonly zipService: ZipPort,
    private readonly uuidAdapter: UuidAdapter,
  ) {}

  async execute(user: User, dto: CreateBatchDto): Promise<BatchProcess> {
    // Validate template
    const template = await this.templateRepository.findById(dto.templateId);
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    if (!template.isAccessibleByUser(user)) {
      throw new BadRequestException("You don't have access to this template");
    }

    // Create batch process
    const batch = this.batchProcessRepository.create({
      template,
      user,
      status: BatchStatus.CREATED,
    });

    // Handle file upload if present
    if (dto.file) {
      try {
        const files = await this.zipService.extractFiles(dto.file);

        // Validate all files are PDF
        const invalidFiles = files.filter((file) => !file.name.endsWith('.pdf'));
        if (invalidFiles.length > 0) {
          throw new BadRequestException('Zip file contains non-PDF files');
        }

        // Add files to batch process
        await Promise.all(
          files.map(async (file) => {
            const path = `uploads/${user.id}/batch/${batch.id}/${this.uuidAdapter.generate()}`;
            await this.fileStorage.uploadFromBuffer(path, file.content);
            const fileEntity = this.fileRepository.create({
              filename: file.name,
              status: FileStatus.PENDING,
              storagePath: path,
              batchProcess: batch,
            });
            batch.addFile(fileEntity);
          }),
        );
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Invalid zip file');
      }
    }

    try {
      await this.batchProcessRepository.save();
    } catch (error) {
      await this.fileStorage.deleteFolder(`uploads/${user.id}/batch/${batch.id}`);
      throw error;
    }
    return batch;
  }
}
