import { RetryWebhookDeliveryUseCase } from '@lib/webhook-dispatcher/core/application/use-cases/retry-webhook-delivery.use-case';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

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
