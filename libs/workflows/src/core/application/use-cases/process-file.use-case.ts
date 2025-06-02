import { BadRequestException, Injectable } from '@nestjs/common';
import { FileRecord } from '@lib/documents/core/domain/entities/file-records.entity';
import { DocumentProcessorPort } from '@lib/workflows/core/application/ports/document-processor.port';
import { WebhookNotifierPort } from '@lib/documents/core/application/ports/webhook-notifier.port';
import { BatchDbPort } from '@lib/documents/core/application/ports/batch-db.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { RetriableError } from '@lib/workflows/nfe/nfse-text.workflow';
import { FileProcessDbPort } from '@lib/documents/core/application/ports/file-process-db.port';

export interface ProcessFileParams {
  fileId: FileRecord['id'];
  shouldConsolidateOutput?: boolean;
}

@Injectable()
export class ProcessFileUseCase {
  private readonly outputConsolidationQueue: string;
  private readonly creditSpendingQueue: string;

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
    const outputQueueName = this.configService.get<string>('OUTPUT_CONSOLIDATION_QUEUE');
    if (!outputQueueName) {
      throw new Error('OUTPUT_CONSOLIDATION_QUEUE is not set');
    }
    this.outputConsolidationQueue = outputQueueName;

    const creditQueueName = this.configService.get<string>('CREDIT_SPENDING_QUEUE');
    if (!creditQueueName) {
      throw new Error('CREDIT_SPENDING_QUEUE is not set');
    }
    this.creditSpendingQueue = creditQueueName;
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

    if (user.credits <= 0) {
      file.markFailed('Insufficient credits');
      await this.fileProcessDbPort.save();
      return file;
    }

    const pdfBuffer = await this.fileStoragePort.getBuffer(file.filePath);
    const result = await this.documentProcessorPort.process(pdfBuffer, template);
    // Check if a Together request was made to queue credit spending
    if (result.shouldBillCustomer) {
      try {
        await this.queuePort.sendMessage(
          this.creditSpendingQueue,
          { userId: user.id, operationId: file.id },
          { fifo: true, groupId: user.id },
        );
        this.logger.info(`Credit spending queued for file ${file.id} and user ${user.id}`);
      } catch (error) {
        this.logger.error('Error queuing credit spending', error);
        // Don't throw error - continue with file processing
      }
    }

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
