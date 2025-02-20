import { Injectable } from '@nestjs/common';
import { OllamaClient } from '../clients/ollama-client';
import { validateOrReject } from 'class-validator';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { PdfPort } from '@doc/infra/pdf/ports/pdf.port';
import { PinoLogger } from 'nestjs-pino';
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

  async execute(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult> {
    try {
      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new Error(`File is too Big)`);
      }

      if (!this.isTemplateMetadata(template, ['prompt'])) {
        throw new Error(`Template is not a valid template for NFE text extraction`);
      }

      const { text, numPages } = await this.pdfExtractor.extractFirstPage(fileBuffer);

      let warnings: string[] | undefined;
      if (numPages > 1) {
        warnings = [`File has ${numPages} pages. Only the first page will be used.`];
      }

      // Create prompt with PDF text
      const prompt = buildPrompt(template, text);

      // Parallel requests to both models
      // const [qwenResponse, llamaResponse] = await Promise.all([
      //   this.ollamaClient.generate(prompt, 'nfe-qwen'),
      //   this.ollamaClient.generate(prompt, 'nfe-llama3.1'),
      // ]);

      const qwenResponse = await this.ollamaClient.generate(prompt, 'nfe-qwen');
      // const llamaResponse = await this.ollamaClient.generate(prompt, 'nfe-llama3.1');

      // Parse responses
      const qwenJson = this.parseResponse(qwenResponse);
      // const llamaJson = this.parseResponse(qwenResponse);

      // Validate responses
      await this.validateResponse(qwenJson);
      // await this.validateResponse(llamaJson);

      // Compare responses
      // if (!this.deepEqual(qwenJson, llamaJson)) {
      //   return DocumentProcessResult.fromError({
      //     code: 'PROCESS_ERROR',
      //     message: 'Could not validate response are not equal',
      //     data: { result1: qwenJson, result2: llamaJson },
      //   });
      // }

      return DocumentProcessResult.fromSuccess(qwenJson, warnings);
    } catch (error) {
      return DocumentProcessResult.fromError({
        code: 'PROCESS_ERROR',
        message: error.message,
      });
    }
  }

  private parseResponse(response: string): NfeDto {
    try {
      // Extract JSON content between curly braces
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}');

      if (start === -1 || end === -1) {
        throw new Error('No JSON object found in response');
      }

      const jsonString = response.slice(start, end + 1);
      return plainToInstance(NfeDto, JSON.parse(jsonString), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error);
      throw new Error('Could not parse document');
    }
  }

  private async validateResponse(data: NfeDto): Promise<void> {
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
