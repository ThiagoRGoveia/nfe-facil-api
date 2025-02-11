import { Injectable, NotFoundException } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { BatchProcess, BatchStatus } from '../../domain/entities/batch-process.entity';
import { QueuePort } from '@/infra/aws/sqs/ports/queue.port';
import { ConfigService } from '@nestjs/config';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { FileToProcess } from '../../domain/entities/file-process.entity';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AsyncBatchProcessUseCase {
  private readonly queueName: string;
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly queuePort: QueuePort,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    const queueName = this.configService.get<string>('DOCUMENT_PROCESSING_QUEUE');

    if (!queueName) {
      throw new Error('DOCUMENT_PROCESSING_QUEUE is not set');
    }

    this.queueName = queueName;
  }

  async execute(batchId: string) {
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Batch has already been started');
    }

    this.batchRepository.update(batchId, { status: BatchStatus.PROCESSING });
    await this.batchRepository.save();

    const limit = 100;
    let offset = 0;
    let files: FileToProcess[];

    do {
      files = await this.fileProcessRepository.findByBatchPaginated(batchId, limit, offset);
      await this.processFiles(files, batch);
      offset += limit;
    } while (files.length === limit);
  }

  private async processFiles(files: FileToProcess[], batch: BatchProcess) {
    await Promise.all(
      files.map(async (doc) => {
        try {
          await this.queuePort.sendMessage(this.queueName, {
            user: batch.user,
            templateId: batch.template.id,
            file: {
              fileName: doc.fileName,
              filePath: doc.filePath,
            },
            batchId: batch.id,
          });
        } catch (error) {
          this.logger.error(`Failed to queue file ${doc.fileName}: %o`, error);
        }
      }),
    );
  }
}
