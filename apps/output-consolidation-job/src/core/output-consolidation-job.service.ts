import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { HandleOutputFormatUseCase } from '@/core/documents/application/use-cases/handle-output-format.use-case';

interface ConsolidationMessage {
  batchId: string;
}

@Injectable()
export class OutputConsolidationJobService {
  private readonly logger = new Logger(OutputConsolidationJobService.name);

  constructor(
    private readonly batchDbPort: BatchDbPort,
    private readonly handleOutputFormatUseCase: HandleOutputFormatUseCase,
  ) {}

  async processMessage(message: ConsolidationMessage): Promise<void> {
    this.logger.log(`Processing consolidation for batch ${message.batchId}`);

    try {
      const batch = await this.batchDbPort.findById(message.batchId);

      if (!batch) {
        throw new NotFoundException(`Batch with ID ${message.batchId} not found`);
      }

      await this.handleOutputFormatUseCase.execute(batch);
      this.logger.log(`Successfully consolidated output for batch ${message.batchId}`);
    } catch (error) {
      this.logger.error(`Error consolidating output for batch ${message.batchId}:`, error);
      throw error;
    }
  }
}
