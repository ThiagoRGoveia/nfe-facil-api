import { BadRequestException, Injectable } from '@nestjs/common';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { DocumentProcessorPort } from '@/core/documents/application/ports/document-processor.port';
import { WebhookNotifierPort } from '@/core/documents/application/ports/webhook-notifier.port';
import { FileProcessDbPort } from '@/core/documents/application/ports/file-process-db.port';
import { User } from '@/core/users/domain/entities/user.entity';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { Readable } from 'stream';
import { HandleOutputFormatUseCase } from './handle-output-format.use-case';
import { OutputFormat } from '@/core/documents/domain/types/output-format.type';

const MAX_FILE_SIZE = 300 * 1024; // 300KB in bytes

export interface ProcessFileParams {
  user: User;
  file: FileToProcess;
  outputFormats?: OutputFormat[];
}

@Injectable()
export class ProcessFileUseCase {
  constructor(
    private readonly fileProcessDbPort: FileProcessDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly webhookNotifierPort: WebhookNotifierPort,
    private readonly batchDbPort: BatchDbPort,
    private readonly fileStoragePort: FileStoragePort,
    private readonly handleOutputFormatUseCase: HandleOutputFormatUseCase,
  ) {}

  async execute(params: ProcessFileParams): Promise<FileToProcess> {
    const { file, user, outputFormats = ['json'] } = params;
    const template = await file.template.load();
    const batchProcess = await file.batchProcess?.load();

    if (!template) {
      throw new BadRequestException('Template not found');
    }

    if (!template.isAccessibleByUser(user)) {
      throw new BadRequestException("You don't have access to this template");
    }

    file.markProcessing();
    await this.fileProcessDbPort.save();

    if (!file.filePath) {
      throw new BadRequestException('Missing file for file processing');
    }

    const pdfBuffer = await this.streamToBuffer(await this.fileStoragePort.get(file.filePath));
    const fileSize = pdfBuffer.length;

    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException(`File ${file.id} is too large (max ${MAX_FILE_SIZE / 1024}KB)`);
    }

    const result = await this.documentProcessorPort.process(pdfBuffer, template);

    if (result.isSuccess()) {
      file.setResult(result.payload);
      file.markCompleted();
      await this.webhookNotifierPort.notifySuccess(file);
      file.markNotified();
    } else if (result.isError()) {
      file.markFailed(result.errorMessage);
      await this.webhookNotifierPort.notifyFailure(file);
      file.markNotified();
    }
    if (batchProcess) {
      const updatedBatchProcess = await this.batchDbPort.incrementProcessedFilesCount(batchProcess.id);
      if (updatedBatchProcess.totalFiles === updatedBatchProcess.processedFiles) {
        updatedBatchProcess.markCompleted();
        await this.handleOutputFormatUseCase.execute(updatedBatchProcess, outputFormats);
        await this.webhookNotifierPort.notifyBatchCompleted(updatedBatchProcess);
      }
    }

    await this.fileProcessDbPort.save();
    return file;
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
