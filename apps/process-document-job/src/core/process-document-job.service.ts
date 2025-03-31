import { Injectable } from '@nestjs/common';
import { ProcessFileUseCase } from 'apps/api/src/core/documents/application/use-cases/process-file.use-case';
import { DatePort } from '@/infra/adapters/date.adapter';
import { PinoLogger } from 'nestjs-pino';
import { MikroORM } from '@mikro-orm/core';
type MessageParam = {
  fileId: string;
};

@Injectable()
export class ProcessDocumentJobService {
  constructor(
    private readonly processFileUseCase: ProcessFileUseCase,
    private readonly datePort: DatePort,
    private readonly logger: PinoLogger,
    private readonly orm: MikroORM,
  ) {}

  async processMessage(message: object) {
    try {
      this.logger.info(`Processing document message: ${JSON.stringify(message)}`);

      if (!this.validateMessage(message)) {
        throw new Error('Invalid message: missing fileId in message body');
      }

      const { fileId } = message;

      // Process the file using the ProcessFileUseCase
      await this.runInRequestContext(async () => {
        await this.processFileUseCase.execute({ fileId });
      });

      this.logger.info(`File processed successfully: ${fileId}`);

      return {
        success: true,
        processedAt: this.datePort.now().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async runInRequestContext(callback: () => Promise<void>) {
    const em = this.orm.em.fork();
    await em.transactional(callback);
  }

  private validateMessage(message: object): message is MessageParam {
    return 'fileId' in message;
  }
}
