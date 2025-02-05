import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { WebhookNotifierPort } from '../../application/ports/webhook-notifier.port';
import { FileToProcess } from '../../domain/entities/file-process.entity';
import { NotifyWebhookUseCase } from '@/core/webhooks/application/use-cases/notify-webhook.use-case';
import { WebhookEvent } from '@/core/webhooks/domain/entities/webhook.entity';
import { User } from '@/core/users/domain/entities/user.entity';

@Injectable()
export class WebhookNotifierAdapter implements WebhookNotifierPort {
  constructor(private readonly notifyWebhookUseCase: NotifyWebhookUseCase) {}

  async notifySuccess(process: FileToProcess): Promise<void> {
    const user = await this.getUserFromProcess(process);
    await this.notifyWebhookUseCase.execute({
      user,
      event: WebhookEvent.DOCUMENT_PROCESSED,
      payload: {
        documentId: process.id,
        status: process.status,
        fileName: process.fileName,
        processedAt: new Date(),
        payload: process.payload,
      },
    });
  }

  async notifyFailure(process: FileToProcess): Promise<void> {
    const user = await this.getUserFromProcess(process);
    await this.notifyWebhookUseCase.execute({
      user,
      event: WebhookEvent.DOCUMENT_FAILED,
      payload: {
        documentId: process.id,
        error: process.error,
        fileName: process.fileName,
        failedAt: new Date(),
      },
    });
  }

  private async getUserFromProcess(process: FileToProcess): Promise<User> {
    const template = await process.template.load({ populate: ['user'] });
    if (!template) {
      throw new InternalServerErrorException(`Template not found for process ${process.id}`);
    }
    const user = await template.user?.load();
    if (!user) {
      throw new InternalServerErrorException(`User not found for template ${template.id}`);
    }
    return user;
  }
}
