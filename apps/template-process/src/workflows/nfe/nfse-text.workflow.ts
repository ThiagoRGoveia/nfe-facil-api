import { Injectable } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { PdfPort } from '@doc/infra/pdf/ports/pdf.port';
import { PinoLogger } from 'nestjs-pino';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { plainToInstance } from 'class-transformer';
import { NfseDto } from './dto/nfse.dto';
import { BaseWorkflow } from '../_base.workflow';
import { TogetherClient } from '../clients/together-client';
import { ConfigService } from '@nestjs/config';

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
    private readonly configService: ConfigService,
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
        return this.processWithText(text, template, warnings);
      }

      return this.processWithImage(fileBuffer, template, warnings);
    } catch (error) {
      return DocumentProcessResult.fromError({
        code: 'PROCESS_ERROR',
        message: error.message,
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
    const responses = await Promise.all(
      modelConfigs.map((modelConfig) =>
        this.togetherClient.generate(prompt, {
          model: modelConfig.model,
          systemMessage: modelConfig.systemMessage,
          config: modelConfig.config,
        }),
      ),
    );

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
      });
    }

    return DocumentProcessResult.fromSuccess(responsesJson[0], warnings);
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
      });
    }

    if (images.length > 1) {
      warnings.push(`Found ${images.length} images. Only the first image will be used.`);
    }

    const prompt = template.metadata.promptForImage;
    const modelConfigs = template.metadata.modelConfigsForImage;
    const responses = await Promise.all(
      modelConfigs.map((modelConfig) =>
        this.togetherClient.generateWithImage(prompt, images[0], {
          model: modelConfig.model,
          systemMessage: modelConfig.systemMessage,
          config: modelConfig.config,
        }),
      ),
    );

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
      });
    }

    return DocumentProcessResult.fromSuccess(responsesJson[0], warnings);
  }

  private parseResponse(response: string): NfseDto {
    try {
      // Extract JSON content between curly braces
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}');

      if (start === -1 || end === -1) {
        throw new Error('No JSON object found in response');
      }

      const jsonString = response.slice(start, end + 1);
      return plainToInstance(NfseDto, JSON.parse(jsonString), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error);
      throw new Error('Could not parse document');
    }
  }

  private async validateResponse(data: NfseDto[]): Promise<void> {
    try {
      await validateOrReject(data);
    } catch (errors) {
      this.logger.error(errors);
      throw new Error('Could not validate document');
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
