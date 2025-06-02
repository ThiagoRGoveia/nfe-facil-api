import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BatchDbPort } from '@lib/documents/core/application/ports/batch-db.port';
import { HandleOutputFormatUseCase } from '@lib/documents/core/application/use-cases/handle-output-format.use-case';
import { CreateRequestContext, MikroORM } from '@mikro-orm/core';

interface ConsolidationMessage {
  batchId: string;
}

@Injectable()
export class OutputConsolidationJobService {
  private readonly logger = new Logger(OutputConsolidationJobService.name);

  constructor(
    private readonly batchDbPort: BatchDbPort,
    private readonly handleOutputFormatUseCase: HandleOutputFormatUseCase,
    private readonly orm: MikroORM,
  ) {}

  async processMessage(message: ConsolidationMessage): Promise<void> {
    this.logger.log(`Processing consolidation for batch ${message.batchId}`);
    try {
      await this.processInDbContext(message.batchId);
      this.logger.log(`Successfully consolidated output for batch ${message.batchId}`);
    } catch (error) {
      this.logger.error(`Error consolidating output for batch ${message.batchId}:`, error);
      throw error;
    }
  }

  @CreateRequestContext()
  async processInDbContext(batchId: string): Promise<void> {
    const batch = await this.batchDbPort.findById(batchId);
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    await this.handleOutputFormatUseCase.execute(batch);
  }
}
