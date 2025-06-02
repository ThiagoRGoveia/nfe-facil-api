import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { PdfPort } from 'apps/process-document-job/src/infra/pdf/ports/pdf.port';
import { PinoLogger } from 'nestjs-pino';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { plainToInstance } from 'class-transformer';
import { NfseDto } from './dto/nfse.dto';
import { BaseWorkflow } from '../_base.workflow';
import { TogetherClient } from '../clients/together-client';

export class RetriableError extends ServiceUnavailableException {
  constructor(message: string) {
    super(message);
    this.name = 'RetriableError';
  }
}

export class NonRetriableError extends ServiceUnavailableException {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetriableError';
  }
}

type ModelConfig = {
  model: string;
  systemMessage: string;
  config: {
    maxTokens: number;
    temperature: number;
    topP: number;
    topK: number;
    repetitionPenalty: number;
  };
};

type NfeTemplateMetadata = {
  promptForText: string;
  promptForImage: string;
  modelConfigsForText: ModelConfig[];
  modelConfigsForImage: ModelConfig[];
};

const MAX_FILE_SIZE = 300 * 1024; // 300KB in bytes

const buildPrompt = (template: Template<NfeTemplateMetadata>, nfeText: string) => {
  return template.metadata.promptForText.replace('{{nfeText}}', nfeText);
};

@Injectable()
export class NfeTextWorkflow extends BaseWorkflow {
  constructor(
    private readonly pdfExtractor: PdfPort,
    private readonly togetherClient: TogetherClient,
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async execute(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult> {
    try {
      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new Error(`File is too Big)`);
      }

      if (!this.isNfeTemplateMetadata(template)) {
        throw new Error(`Template is not a valid template for NFE text extraction`);
      }

      const { text, numPages } = await this.pdfExtractor.extractFirstPage(fileBuffer);

      const warnings: string[] = [];
      if (numPages > 1) {
        warnings.push(`File has ${numPages} pages. Only the first page will be used.`);
      }

      if (text.length > 0) {
        return await this.processWithText(text, template, warnings);
      }

      return await this.processWithImage(fileBuffer, template, warnings);
    } catch (error) {
      if (error instanceof RetriableError) {
        return DocumentProcessResult.fromError({
          code: 'PROCESS_ERROR',
          message: error.message,
          shouldRetry: true,
          togetherRequestMade:
            error instanceof Error && 'togetherRequestMade' in error ? (error.togetherRequestMade as boolean) : false,
        });
      }
      return DocumentProcessResult.fromError({
        code: 'PROCESS_ERROR',
        message: error.message,
        shouldRetry: false,
        togetherRequestMade:
          error instanceof Error && 'togetherRequestMade' in error ? (error.togetherRequestMade as boolean) : false,
      });
    }
  }

  private async processWithText(
    text: string,
    template: Template<NfeTemplateMetadata>,
    warnings: string[],
  ): Promise<DocumentProcessResult> {
    // Create prompt with PDF text
    const prompt = buildPrompt(template, text);

    // Parallel requests to both models
    const modelConfigs = template.metadata.modelConfigsForText;
    let togetherRequestMade = false;

    try {
      const responses = await Promise.all(
        modelConfigs.map((modelConfig) =>
          this.togetherClient.generate(prompt, {
            model: modelConfig.model,
            systemMessage: modelConfig.systemMessage,
            config: modelConfig.config,
          }),
        ),
      );

      togetherRequestMade = true;

      // Parse responses
      const responsesJson = responses.map((response) => this.parseResponse(response));

      // Validate responses
      await this.validateResponse(responsesJson);

      // Compare responses
      if (!this.deepEqual(responsesJson)) {
        return DocumentProcessResult.fromError({
          code: 'PROCESS_ERROR',
          message: 'Could not validate response are not equal',
          data: responsesJson,
          shouldRetry: false,
          togetherRequestMade,
        });
      }

      return DocumentProcessResult.fromSuccess(responsesJson[0], warnings, togetherRequestMade);
    } catch (error) {
      if (error instanceof RetriableError) {
        return DocumentProcessResult.fromError({
          code: 'PROCESS_ERROR',
          message: error.message,
          shouldRetry: true,
          togetherRequestMade,
        });
      }
      return DocumentProcessResult.fromError({
        code: 'PROCESS_ERROR',
        message: error.message,
        shouldRetry: false,
        togetherRequestMade,
      });
    }
  }

  private async processWithImage(
    fileBuffer: Buffer,
    template: Template<NfeTemplateMetadata>,
    warnings: string[],
  ): Promise<DocumentProcessResult> {
    const images = await this.pdfExtractor.extractImages(fileBuffer);

    if (images.length === 0) {
      return DocumentProcessResult.fromError({
        code: 'PROCESS_ERROR',
        message: 'No text or images found in the document',
        shouldRetry: false,
        togetherRequestMade: false,
      });
    }

    if (images.length > 1) {
      warnings.push(`Found ${images.length} images. Only the first image will be used.`);
    }

    const prompt = template.metadata.promptForImage;
    const modelConfigs = template.metadata.modelConfigsForImage;
    let togetherRequestMade = false;

    try {
      const responses = await Promise.all(
        modelConfigs.map((modelConfig) =>
          this.togetherClient.generateWithImage(prompt, images[0], {
            model: modelConfig.model,
            systemMessage: modelConfig.systemMessage,
            config: modelConfig.config,
          }),
        ),
      );

      togetherRequestMade = true;

      // Parse responses
      const responsesJson = responses.map((response) => this.parseResponse(response));

      // Validate responses
      await this.validateResponse(responsesJson);

      // Compare responses
      if (!this.deepEqual(responsesJson)) {
        return DocumentProcessResult.fromError({
          code: 'PROCESS_ERROR',
          message: 'Could not validate response are not equal',
          data: responsesJson,
          shouldRetry: false,
          togetherRequestMade,
        });
      }

      return DocumentProcessResult.fromSuccess(responsesJson[0], warnings, togetherRequestMade);
    } catch (error) {
      return DocumentProcessResult.fromError({
        code: 'PROCESS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        shouldRetry: false,
        togetherRequestMade,
      });
    }
  }

  private parseResponse(response: string): NfseDto {
    try {
      // Extract JSON content between curly braces
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}');

      if (start === -1 || end === -1) {
        throw new Error('No JSON object found in response');
      }

      const jsonString = response.slice(start, end + 1).replaceAll('NULL', 'null');
      return plainToInstance(NfseDto, JSON.parse(jsonString), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error);
      throw new NonRetriableError(`Could not parse document: ${response}`);
    }
  }

  private async validateResponse(data: NfseDto[]): Promise<void> {
    try {
      await validateOrReject(data);
    } catch (errors) {
      this.logger.error(errors);
      throw new NonRetriableError('Could not validate document');
    }
  }

  private isNfeTemplateMetadata(template: Template): template is Template<NfeTemplateMetadata> {
    return (
      'promptForText' in template.metadata &&
      'promptForImage' in template.metadata &&
      'modelConfigsForText' in template.metadata &&
      'modelConfigsForImage' in template.metadata &&
      Array.isArray(template.metadata.modelConfigsForText) &&
      Array.isArray(template.metadata.modelConfigsForImage) &&
      template.metadata.modelConfigsForText.every(
        (modelConfig) => 'model' in modelConfig && 'systemMessage' in modelConfig && 'config' in modelConfig,
      ) &&
      template.metadata.modelConfigsForImage.every(
        (modelConfig) => 'model' in modelConfig && 'systemMessage' in modelConfig && 'config' in modelConfig,
      )
    );
  }

  private deepEqual(list: unknown[]): boolean {
    const firstItem = JSON.stringify(list[0]);
    return list.every((item) => JSON.stringify(item) === firstItem);
  }
}
