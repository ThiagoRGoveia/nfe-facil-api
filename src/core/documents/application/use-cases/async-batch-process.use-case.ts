import { Injectable, NotFoundException } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { QueuePort } from '@/infra/aws/sqs/ports/queue.port';
import { ConfigService } from '@nestjs/config';
import { BatchFile } from '../../domain/entities/batch-file.entity';
import { BatchFileDbPort } from '../ports/batch-file-db.port';
@Injectable()
export class AsyncBatchProcessUseCase {
  private readonly queueName: string;
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly batchFileRepository: BatchFileDbPort,
    private readonly queuePort: QueuePort,
    private readonly configService: ConfigService,
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
    let files: BatchFile[];

    do {
      files = await this.batchFileRepository.findByBatchPaginated(batchId, limit, offset);

      await Promise.all(
        files.map(async (file) => {
          try {
            await this.queuePort.sendMessage(this.queueName, {
              user: batch.user,
              templateId: batch.template.id,
              file: {
                fileName: file.filename,
                filePath: file.storagePath,
              },
              batchId,
            });
          } catch (error) {
            console.error(`Failed to queue file ${file.filename}:`, error);
          }
        }),
      );

      offset += limit;
    } while (files.length === limit);
  }
}
