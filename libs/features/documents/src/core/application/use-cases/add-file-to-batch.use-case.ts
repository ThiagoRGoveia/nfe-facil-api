import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { FileProcessStatus, FileRecord } from '../../domain/entities/file-records.entity';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { ExtractedFile, ZipPort } from 'libs/tooling/zip/src/core/zip.port';
import { PinoLogger } from 'nestjs-pino';

type FilesToAdd = {
  file: Buffer;
  filename: string;
  mimetype: string;
}[];

@Injectable()
export class AddFileToBatchUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly fileStoragePort: FileStoragePort,
    private readonly uuidAdapter: UuidAdapter,
    private readonly zipService: ZipPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(params: { batchId: string; files: FilesToAdd; user: User }) {
    const batch = await this.batchRepository.findById(params.batchId);

    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    if (batch.status !== BatchStatus.CREATED) {
      throw new BadRequestException('Batch is not in CREATED status');
    }

    const allFileProcesses: FileRecord[] = [];

    // Process each file in parallel
    await Promise.all(
      params.files.map(async (fileData) => {
        const fileName = fileData.filename.toLowerCase();
        const isZip = fileName.endsWith('.zip');
        const isPdf = fileName.endsWith('.pdf');

        if (!isZip && !isPdf) {
          throw new BadRequestException('Invalid file type. Only ZIP and PDF are allowed');
        }

        if (isZip) {
          let extractedFiles: ExtractedFile[];
          try {
            extractedFiles = await this.zipService.extractFiles(fileData.file);
          } catch (error) {
            this.logger.error(error);
            throw new BadRequestException(`Invalid ZIP file: ${fileData.filename}`);
          }

          const invalidFiles = extractedFiles.filter((file) => !file.name.toLowerCase().endsWith('.pdf'));
          if (invalidFiles.length > 0) {
            throw new BadRequestException(
              `Zip file ${fileData.filename} contains non-PDF files: ${invalidFiles.map((f) => f.name).join(', ')}`,
            );
          }

          let uploadedPaths: string[] = [];
          try {
            uploadedPaths = await Promise.all(
              extractedFiles.map(async (file) => {
                const path = `uploads/${params.user.id}/batch/${batch.id}/${this.uuidAdapter.generate()}.pdf`;
                await this.fileStoragePort.uploadFromBuffer(path, file.content, 'application/pdf');
                return path;
              }),
            );

            const fileProcesses = extractedFiles.map((file, index) => {
              return this.fileProcessRepository.create({
                fileName: file.name,
                status: FileProcessStatus.PENDING,
                filePath: uploadedPaths[index],
                template: batch.template,
                batchProcess: batch,
                user: params.user,
              });
            });

            allFileProcesses.push(...fileProcesses);
          } catch (error) {
            await Promise.all(uploadedPaths.map((path) => this.fileStoragePort.delete(path)));
            if (error instanceof HttpException) {
              throw error;
            }
            throw new BadRequestException(`Failed to process ZIP file: ${fileData.filename}`);
          }
        } else {
          // Handle single PDF file
          let filePath: string | undefined;
          try {
            filePath = await this.fileStoragePort.uploadFromBuffer(
              `uploads/${params.user.id}/batch/${batch.id}/${this.uuidAdapter.generate()}`,
              fileData.file,
              fileData.mimetype,
            );

            const fileProcess = this.fileProcessRepository.create({
              fileName: fileData.filename,
              status: FileProcessStatus.PENDING,
              filePath: filePath,
              template: batch.template,
              batchProcess: batch,
              user: params.user,
            });

            allFileProcesses.push(fileProcess);
          } catch (uploadError) {
            if (filePath) {
              await this.fileStoragePort.delete(filePath);
            }
            if (uploadError instanceof HttpException) {
              throw uploadError;
            }
            throw new BadRequestException(`Failed to store file: ${fileData.filename}`);
          }
        }
      }),
    );

    try {
      await this.fileProcessRepository.save();
    } catch (error) {
      // Clean up all uploaded files if save fails
      await Promise.all(
        allFileProcesses.map(async (process) => {
          if (process.filePath) {
            await this.fileStoragePort.delete(process.filePath);
          }
        }),
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to add files to batch');
    }

    return allFileProcesses;
  }
}
