import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CreateRequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';
import { SpendCreditsUseCase } from '@/core/user-credits/application/use-cases';
export interface SpendCreditMessage {
  userId: string;
  operationId: string;
}

@Injectable()
export class CreditSpendingJobService {
  constructor(
    private readonly spendCreditsUseCase: SpendCreditsUseCase,
    private readonly logger: PinoLogger,
    private readonly orm: MikroORM,
  ) {
    this.logger.setContext('CreditSpendingJobService');
  }

  async processMessage(message: SpendCreditMessage): Promise<void> {
    try {
      this.logger.info(`Processing credit spending for user ${message.userId}`);

      const result = await this.runInContext(message);

      if (result) {
        this.logger.info(`Credit spent successfully for user ${message.userId}`);
      } else {
        this.logger.warn(`Failed to spend credit for user ${message.userId} - insufficient funds`);
      }
    } catch (error) {
      this.logger.error(`Error processing credit spending: ${error.message}`, error.stack);
      throw error; // Rethrow to trigger SQS retry
    }
  }

  @CreateRequestContext()
  private async runInContext(message: SpendCreditMessage) {
    return await this.spendCreditsUseCase.execute({
      userId: message.userId,
      amount: 1, // Always spend exactly 1 credit
      operationId: message.operationId,
      description: 'Document processing with Together API',
      metadata: {
        source: 'together-api',
        operationType: 'document-processing',
      },
    });
  }
}
