import { BadRequestException, Injectable } from '@nestjs/common';
import { WebhookDbPort } from '../ports/webhook-db.port';
import { User } from '@/core/users/domain/entities/user.entity';
import { Webhook } from '../../domain/entities/webhook.entity';
import { PinoLogger } from 'nestjs-pino';

interface DeleteWebhookInput {
  user: User;
  id: Webhook['id'];
}

@Injectable()
export class DeleteWebhookUseCase {
  constructor(
    private readonly webhookRepository: WebhookDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(params: DeleteWebhookInput): Promise<void> {
    try {
      const webhook = await this.webhookRepository.findById(params.id);

      if (!webhook) {
        throw new BadRequestException(`Webhook with id ${params.id} not found`);
      }

      if (webhook.user.id !== params.user.id) {
        throw new BadRequestException('You are not allowed to delete this webhook');
      }

      await this.webhookRepository.delete(params.id);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to delete webhook');
    }
  }
}
