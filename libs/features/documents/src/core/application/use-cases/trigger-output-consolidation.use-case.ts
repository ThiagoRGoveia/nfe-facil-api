import { BatchDbPort } from '../ports/batch-db.port';
import { ConfigService } from '@nestjs/config';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TriggerOutputConsolidationUseCase {
  private readonly outputConsolidationQueue: string;

  constructor(
    private readonly batchDbPort: BatchDbPort,
    private readonly queuePort: QueuePort,
    private readonly configService: ConfigService,
  ) {
    const outputQueueName = this.configService.get<string>('OUTPUT_CONSOLIDATION_QUEUE');
    if (!outputQueueName) {
      throw new Error('OUTPUT_CONSOLIDATION_QUEUE is not set');
    }
    this.outputConsolidationQueue = outputQueueName;
  }

  async execute(batchId: string) {
    const batch = await this.batchDbPort.findById(batchId);

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    await this.queuePort.sendMessage(this.outputConsolidationQueue, {
      batchId: batchId,
    });

    return batch;
  }
}
