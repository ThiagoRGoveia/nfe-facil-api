import { Injectable } from '@nestjs/common';
import { OllamaClient } from '../clients/ollama-client';
import { validateOrReject } from 'class-validator';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { PdfPort } from '@doc/infra/pdf/ports/pdf.port';
import { PinoLogger } from 'nestjs-pino';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { plainToInstance } from 'class-transformer';
import { NfeDto } from './dto/nfe.dto';
import { BaseWorkflow } from '../_base.workflow';

type TemplateMetadata = {
  prompt: string;
};

const MAX_FILE_SIZE = 300 * 1024; // 300KB in bytes

const buildPrompt = (template: Template<TemplateMetadata>, nfeText: string) => {
  return template.metadata.prompt.replace('{{nfeText}}', nfeText);
};

@Injectable()
export class NfeTextWorkflow extends BaseWorkflow<TemplateMetadata> {
  constructor(
    fileStoragePort: FileStoragePort,
    private readonly pdfExtractor: PdfPort,
    private readonly ollamaClient: OllamaClient,
    logger: PinoLogger,
  ) {
    super(fileStoragePort, logger);
  }

  async execute(fileToProcess: FileToProcess): Promise<DocumentProcessResult> {
    try {
      if (!fileToProcess.filePath) {
        throw new Error(`File ${fileToProcess.id} has no file path`);
      }

      const template = await fileToProcess.template.load();
      if (!template) {
        throw new Error(`Template ${fileToProcess.template.id} not found`);
      }

      if (!this.isTemplateMetadata(template, ['prompt'])) {
        throw new Error(`Template ${fileToProcess.template.id} is not a valid template for NFE text extraction`);
      }

      // Get PDF from S3
      const pdfBuffer = await this.streamToBuffer(await this.fileStoragePort.get(fileToProcess.filePath));

      const fileSize = pdfBuffer.length;
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error(`File ${fileToProcess.id} is too Big)`);
      }

      const { text, numPages } = await this.pdfExtractor.extractFirstPage(pdfBuffer);

      let warnings: string[] | undefined;
      if (numPages > 1) {
        warnings = [`File ${fileToProcess.fileName} has ${numPages} pages. Only the first page will be used.`];
      }

      // Create prompt with PDF text
      const prompt = buildPrompt(template, text);

      // Parallel requests to both models
      const [qwenResponse, llamaResponse] = await Promise.all([
        this.ollamaClient.generate(prompt, 'nfe-qwen'),
        this.ollamaClient.generate(prompt, 'nfe-llama3.1'),
      ]);

      // Parse responses
      const qwenJson = this.parseResponse(qwenResponse);
      const llamaJson = this.parseResponse(llamaResponse);

      // Validate responses
      await this.validateResponse(qwenJson);
      await this.validateResponse(llamaJson);

      // Compare responses
      if (!this.deepEqual(qwenJson, llamaJson)) {
        return DocumentProcessResult.fromError({
          code: 'PROCESS_ERROR',
          message: 'Could not validate response are not equal',
          data: { result1: qwenJson, result2: llamaJson },
        });
      }

      return DocumentProcessResult.fromSuccess(qwenJson, warnings);
    } catch (error) {
      return DocumentProcessResult.fromError({
        code: 'PROCESS_ERROR',
        message: error.message,
      });
    }
  }

  private parseResponse(response: string): object {
    try {
      // Extract JSON content between curly braces
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}');

      if (start === -1 || end === -1) {
        throw new Error('No JSON object found in response');
      }

      const jsonString = response.slice(start, end + 1);
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(error);
      throw new Error('Could not parse document');
    }
  }

  private async validateResponse(data: object): Promise<void> {
    try {
      await validateOrReject(
        plainToInstance(NfeDto, data, {
          excludeExtraneousValues: true,
        }),
      );
    } catch (errors) {
      this.logger.error(errors);
      throw new Error('Could not validate document');
    }
  }
}
