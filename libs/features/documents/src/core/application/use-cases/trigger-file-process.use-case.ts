import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { FileRecord } from '../../domain/entities/file-records.entity';

@Injectable()
export class TriggerFileProcessUseCase {
  private readonly queueName: string;
  constructor(
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

  async execute(file: FileRecord) {
    try {
      await this.queuePort.sendMessage(
        this.queueName,
        {
          fileId: file.id,
        },
        {
          fifo: true,
          groupId: file.batchProcess?.id || file.id,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue file ${file.id}: %o`, error);
      throw new ServiceUnavailableException('Failed to process file');
    }
  }
}
