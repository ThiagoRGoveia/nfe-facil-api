import { BadRequestException, Injectable } from '@nestjs/common';
import { WebhookDbPort } from '../ports/webhook-db.port';
import { Webhook, WebhookStatus } from '../../domain/entities/webhook.entity';
import { EncryptionPort } from 'libs/tooling/encryption/src/core/ports/encryption.port';
import { ConfigService } from '@nestjs/config';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { CreateWebhookDto } from '../dtos/create-webhook.dto';
import { PinoLogger } from 'nestjs-pino';
interface CreateWebhookInput {
  user: User;
  data: CreateWebhookDto;
}

@Injectable()
export class CreateWebhookUseCase {
  constructor(
    private readonly webhookRepository: WebhookDbPort,
    private readonly encryptionPort: EncryptionPort,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {}

  async execute({ user, data }: CreateWebhookInput): Promise<Webhook> {
    this.validateProductionUrl(data.url);

    const webhook = this.webhookRepository.create({
      user: user,
      name: data.name,
      url: data.url,
      events: data.events,
      authType: data.authType,
      headers: data.headers || {},
      ...(data.authConfig && {
        encryptedConfig: this.encryptionPort.encrypt(JSON.stringify(data.authConfig)),
      }),
      status: WebhookStatus.ACTIVE,
      maxRetries: data.maxRetries,
      timeout: data.timeout,
    });

    try {
      await this.webhookRepository.save();
      return webhook;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to create webhook');
    }
  }

  private validateProductionUrl(url: string): void {
    if (this.configService.get('NODE_ENV') === 'production' && !url.startsWith('https://')) {
      throw new BadRequestException('HTTPS required in production');
    }
  }
}
