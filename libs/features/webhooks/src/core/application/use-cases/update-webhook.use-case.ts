import { BadRequestException, Injectable } from '@nestjs/common';
import { WebhookDbPort } from '../ports/webhook-db.port';
import { UpdateWebhookDto } from '../dtos/update-webhook.dto';
import { Webhook } from '../../domain/entities/webhook.entity';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';

type UpdateWebhookParams = {
  id: Webhook['id'];
  data: UpdateWebhookDto;
  user: User;
};

@Injectable()
export class UpdateWebhookUseCase {
  constructor(
    private readonly webhookRepository: WebhookDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(request: UpdateWebhookParams): Promise<Webhook> {
    const webhook = await this.webhookRepository.findById(request.id);
    if (!webhook) {
      throw new BadRequestException(`Webhook with id ${request.id} not found`);
    }
    if (webhook.user.id !== request.user.id) {
      throw new BadRequestException('You are not allowed to update this webhook');
    }
    const updatedWebhook = this.webhookRepository.update(request.id, request.data);
    if (request.data.active) {
      updatedWebhook.activate();
    } else {
      updatedWebhook.deactivate();
    }
    try {
      await this.webhookRepository.save();
      return updatedWebhook;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to update webhook');
    }
  }
}
