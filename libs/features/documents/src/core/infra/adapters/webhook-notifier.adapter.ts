import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { WebhookNotifierPort } from '../../application/ports/webhook-notifier.port';
import { FileRecord } from '../../domain/entities/file-records.entity';
import { NotifyWebhookUseCase } from '@lib/webhooks/core/webhooks.module';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { DatePort } from 'libs/tooling/date/src/core/date.adapter';

@Injectable()
export class WebhookNotifierAdapter implements WebhookNotifierPort {
  constructor(
    private readonly notifyWebhookUseCase: NotifyWebhookUseCase,
    private readonly logger: PinoLogger,
    private readonly datePort: DatePort,
  ) {}

  async notifySuccess(process: FileRecord): Promise<void> {
    try {
      const user = await this.getUser(process);
      await this.notifyWebhookUseCase.execute({
        user,
        event: WebhookNotifierPort.DOCUMENT_PROCESSED_EVENT,
        payload: {
          documentId: process.id,
          status: process.status,
          fileName: process.fileName,
          processedAt: this.datePort.now(),
          result: process.result,
          batchId: process.batchProcess?.id,
        },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async notifyFailure(process: FileRecord): Promise<void> {
    try {
      const user = await this.getUser(process);
      await this.notifyWebhookUseCase.execute({
        user,
        event: WebhookNotifierPort.DOCUMENT_FAILED_EVENT,
        payload: {
          documentId: process.id,
          error: process.error,
          fileName: process.fileName,
          failedAt: this.datePort.now(),
          batchId: process.batchProcess?.id,
        },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async notifyBatchCompleted(batch: BatchProcess): Promise<void> {
    try {
      const user = await batch.user.load();
      if (!user) {
        throw new InternalServerErrorException(`User not found for batch ${batch.id}`);
      }
      await this.notifyWebhookUseCase.execute({
        user,
        event: WebhookNotifierPort.BATCH_FINISHED_EVENT,
        payload: {
          batchId: batch.id,
        },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async getUser(process: FileRecord): Promise<User> {
    const user = await process.user.load();
    if (!user) {
      throw new InternalServerErrorException(`User not found for process ${process.id}`);
    }
    return user;
  }
}
