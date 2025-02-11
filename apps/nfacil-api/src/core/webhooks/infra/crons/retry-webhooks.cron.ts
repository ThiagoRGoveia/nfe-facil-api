import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RetryWebhookDeliveryUseCase } from '../../application/use-cases/retry-webhook-delivery.use-case';

@Injectable()
export class RetryWebhooksCron {
  constructor(
    private readonly logger: PinoLogger,
    private readonly retryWebhookDeliveryUseCase: RetryWebhookDeliveryUseCase,
  ) {}

  async handleCron(): Promise<void> {
    this.logger.info('Starting webhook retry process');
    await this.retryWebhookDeliveryUseCase.execute();
  }
}
