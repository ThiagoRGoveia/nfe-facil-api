import { Injectable } from '@nestjs/common';
import { OllamaClient } from '../clients/ollama-client';
import { validateOrReject } from 'class-validator';
import { DocumentProcessResult } from '../../../core/template-processes/domain/value-objects/document-process-result';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { PdfTextExtractorPort } from '@/infra/pdf/ports/pdf.port';
import { Readable } from 'stream';
import { PinoLogger } from 'nestjs-pino';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { plainToInstance } from 'class-transformer';
import { NfeDto } from './dto/nfe.dto';

type TemplateMetadata = {
  prompt: string;
};

const MAX_FILE_SIZE = 300 * 1024; // 300KB in bytes

const buildPrompt = (template: Template<TemplateMetadata>, nfeText: string) => {
  return template.metadata.prompt.replace('{{nfeText}}', nfeText);
};

@Injectable()
export class NfeTextWorkflow {
  constructor(
    private readonly fileStoragePort: FileStoragePort,
    private readonly pdfExtractor: PdfTextExtractorPort,
    private readonly ollamaClient: OllamaClient,
    private readonly logger: PinoLogger,
  ) {}

  async execute(fileToProcess: FileToProcess): Promise<DocumentProcessResult> {
    try {
      if (!fileToProcess.filePath) {
        throw new Error(`File ${fileToProcess.id} has no file path`);
      }

      const template = await fileToProcess.template.load();
      if (!template) {
        throw new Error(`Template ${fileToProcess.template.id} not found`);
      }

      if (!this.isTemplateMetadata(template)) {
        throw new Error(`Template ${fileToProcess.template.id} is not a valid template for NFE text extraction`);
      }

      // Get PDF from S3
      const pdfBuffer = await this.streamToBuffer(await this.fileStoragePort.get(fileToProcess.filePath));

      const fileSize = pdfBuffer.length;
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error(`File ${fileToProcess.id} is too Big)`);
      }

      // Extract text from PDF
      const pdfText = await this.pdfExtractor.extract(pdfBuffer);

      // Create prompt with PDF text
      const prompt = buildPrompt(template, pdfText);

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
        return DocumentProcessResult.fromUndetermined({ qwen: qwenJson, llama: llamaJson });
      }

      return DocumentProcessResult.fromSuccess(qwenJson);
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

  private deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private isTemplateMetadata(template: Template): template is Template<TemplateMetadata> {
    return 'prompt' in template.metadata;
  }
}
