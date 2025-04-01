import { BadRequestException, Injectable } from '@nestjs/common';
import { FileRecord } from '@/core/documents/domain/entities/file-records.entity';
import { DocumentProcessorPort } from '@/core/documents/application/ports/document-processor.port';
import { WebhookNotifierPort } from '@/core/documents/application/ports/webhook-notifier.port';
import { FileProcessDbPort } from '@/core/documents/application/ports/file-process-db.port';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { QueuePort } from '@/infra/aws/sqs/ports/queue.port';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { RetriableError } from '@doc/core/workflows/nfe/nfse-text.workflow';

export interface ProcessFileParams {
  fileId: FileRecord['id'];
  shouldConsolidateOutput?: boolean;
}

@Injectable()
export class ProcessFileUseCase {
  private readonly outputConsolidationQueue: string;

  constructor(
    private readonly fileProcessDbPort: FileProcessDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly webhookNotifierPort: WebhookNotifierPort,
    private readonly batchDbPort: BatchDbPort,
    private readonly fileStoragePort: FileStoragePort,
    private readonly queuePort: QueuePort,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    const queueName = this.configService.get<string>('OUTPUT_CONSOLIDATION_QUEUE');
    if (!queueName) {
      throw new Error('OUTPUT_CONSOLIDATION_QUEUE is not set');
    }
    this.outputConsolidationQueue = queueName;
  }

  async execute(params: ProcessFileParams): Promise<FileRecord> {
    const { fileId, shouldConsolidateOutput = true } = params;
    const file = await this.fileProcessDbPort.findById(fileId);

    const user = await file?.user.load();

    if (!file || !user) {
      throw new BadRequestException('File or user not found');
    }

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

    const pdfBuffer = await this.fileStoragePort.getBuffer(file.filePath);
    const result = await this.documentProcessorPort.process(pdfBuffer, template);
    if (result.isSuccess()) {
      file.setResult(result.payload);
      file.markCompleted();
      this.webhookNotifierPort.notifySuccess(file).catch((error) => {
        this.logger.error('Error notifying webhook', error);
      });
      file.markNotified();
    } else if (result.isError()) {
      if (result.shouldRetry) {
        // NOTICE: By throwing an exception here, the process will be retried by the worker
        throw new RetriableError(result.errorMessage);
      }
      file.markFailed(result.errorMessage);
      this.webhookNotifierPort.notifyFailure(file).catch((error) => {
        this.logger.error('Error notifying webhook', error);
      });
      file.markNotified();
    }
    await this.fileProcessDbPort.save();
    if (batchProcess) {
      const updatedBatchProcess = await this.batchDbPort.incrementProcessedFilesCount(batchProcess.id);
      if (updatedBatchProcess.processedFiles >= updatedBatchProcess.totalFiles) {
        updatedBatchProcess.processedFiles = updatedBatchProcess.totalFiles;
        updatedBatchProcess.markCompleted();
        if (shouldConsolidateOutput) {
          await this.queuePort.sendMessage(this.outputConsolidationQueue, {
            batchId: updatedBatchProcess.id,
          });
        }
        await this.webhookNotifierPort.notifyBatchCompleted(updatedBatchProcess);
      }
    }
    await this.batchDbPort.save();
    return file;
  }
}
