import { Injectable } from '@nestjs/common';
import { DatePort } from '@lib/date/core/date.adapter';
import { PinoLogger } from 'nestjs-pino';
import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { ProcessFileUseCase } from '@lib/workflows/core/application/use-cases/process-file.use-case';
import { RetriableError } from '@lib/workflows/nfe/nfse-text.workflow';
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
      await this.runInRequestContext(fileId);

      this.logger.info(`File processed successfully: ${fileId}`);

      return {
        success: true,
        processedAt: this.datePort.now().toISOString(),
      };
    } catch (error) {
      if (error instanceof RetriableError) {
        this.logger.error(`Retriable error processing document: ${error.message}`, error.stack);
        throw error;
      } else {
        this.logger.error(`Error processing document: ${error.message}`, error.stack);
      }
    }
  }

  @CreateRequestContext()
  private async runInRequestContext(fileId: string) {
    return await this.processFileUseCase.execute({ fileId });
  }

  private validateMessage(message: object): message is MessageParam {
    return 'fileId' in message;
  }
}
