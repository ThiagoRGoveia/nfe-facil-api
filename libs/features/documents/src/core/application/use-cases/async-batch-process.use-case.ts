import { Injectable, NotFoundException } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { ConfigService } from '@nestjs/config';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { FileRecord } from '../../domain/entities/file-records.entity';
import { PinoLogger } from 'nestjs-pino';
import { TriggerFileProcessUseCase } from './trigger-file-process.use-case';

@Injectable()
export class AsyncBatchProcessUseCase {
  private readonly queueName: string;
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly queuePort: QueuePort,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly triggerFileProcessUseCase: TriggerFileProcessUseCase,
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
    let files: FileRecord[];

    do {
      files = await this.fileProcessRepository.findByBatchPaginated(batchId, limit, offset);
      await this.processFiles(files);
      offset += limit;
    } while (files.length === limit);
  }

  private async processFiles(files: FileRecord[]) {
    await Promise.all(
      files.map(async (doc) => {
        await this.triggerFileProcessUseCase.execute(doc);
      }),
    );
  }
}
