import { Injectable } from '@nestjs/common';
import { BatchProcess, BatchStatus } from '../../domain/entities/batch-process.entity';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { CreateBatchDto } from '../dtos/create-batch.dto';
import { BadRequestException } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { FileProcessStatus } from '../../domain/entities/file-records.entity';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { FileFormat } from '../../domain/constants/file-formats';
import { PinoLogger } from 'nestjs-pino';
import { ZipPort } from '@lib/zip/core/zip.port';
@Injectable()
export class CreateBatchProcessUseCase {
  constructor(
    private readonly batchProcessRepository: BatchDbPort,
    private readonly templateRepository: TemplateDbPort,
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly fileStorage: FileStoragePort,
    private readonly zipService: ZipPort,
    private readonly uuidAdapter: UuidAdapter,
    private readonly logger: PinoLogger,
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
      requestedFormats: dto.outputFormats || [FileFormat.JSON],
    });

    // Handle file uploads if present
    const { files } = dto;
    if (files && files.length > 0) {
      try {
        let totalFiles = 0;

        // Process each file in parallel
        await Promise.all(
          files.map(async (file) => {
            const fileName = file.fileName.toLowerCase();

            if (fileName.endsWith('.zip')) {
              const files = await this.zipService.extractFiles(file.data);
              const invalidFiles = files.filter((file) => !file.name.endsWith('.pdf'));
              if (invalidFiles.length > 0) {
                throw new BadRequestException(`Zip file ${fileName} contains non-PDF files`);
              }

              await Promise.all(
                files.map(async (file) => {
                  const path = `uploads/${user.id}/batch/${batch.id}/${this.uuidAdapter.generate()}.pdf`;
                  await this.fileStorage.uploadFromBuffer(path, file.content);
                  this.fileProcessRepository.create({
                    fileName: file.name,
                    status: FileProcessStatus.PENDING,
                    filePath: path,
                    template,
                    batchProcess: batch,
                    user,
                  });
                }),
              );

              totalFiles += files.length;
            } else if (fileName.endsWith('.pdf')) {
              const path = `uploads/${user.id}/batch/${batch.id}/${this.uuidAdapter.generate()}.pdf`;
              await this.fileStorage.uploadFromBuffer(path, file.data);
              this.fileProcessRepository.create({
                fileName: file.fileName,
                status: FileProcessStatus.PENDING,
                filePath: path,
                template,
                batchProcess: batch,
                user,
              });
              totalFiles += 1;
            } else {
              throw new BadRequestException('Invalid file type. Only ZIP and PDF are allowed');
            }
          }),
        );

        this.batchProcessRepository.update(batch.id, { totalFiles });
        await this.fileProcessRepository.save();
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Invalid file(s)');
      }
    }

    try {
      await this.batchProcessRepository.save();
    } catch (error) {
      this.logger.error(`Error creating batch process: %o`, error);
      await this.fileStorage.deleteFolder(`uploads/${user.id}/batch/${batch.id}`);
      throw error;
    }
    return batch;
  }
}
