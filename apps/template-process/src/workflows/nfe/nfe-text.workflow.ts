import { Injectable } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { PdfPort } from '@doc/infra/pdf/ports/pdf.port';
import { PinoLogger } from 'nestjs-pino';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { plainToInstance } from 'class-transformer';
import { NfeDto } from './dto/nfe.dto';
import { BaseWorkflow } from '../_base.workflow';
import { TogetherClient } from '../clients/together-client';

type NfeTemplateMetadata = {
  prompt: string;
  modelConfigs: {
    model: string;
    systemMessage: string;
    config: {
      maxTokens: number;
      temperature: number;
      topP: number;
      topK: number;
      repetitionPenalty: number;
    };
  }[];
};

const MAX_FILE_SIZE = 300 * 1024; // 300KB in bytes

const buildPrompt = (template: Template<NfeTemplateMetadata>, nfeText: string) => {
  return template.metadata.prompt.replace('{{nfeText}}', nfeText);
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

      let warnings: string[] | undefined;
      if (numPages > 1) {
        warnings = [`File has ${numPages} pages. Only the first page will be used.`];
      }

      // Create prompt with PDF text
      const prompt = buildPrompt(template, text);

      // Parallel requests to both models
      const modelConfigs = template.metadata.modelConfigs;
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

  private async validateResponse(data: NfeDto[]): Promise<void> {
    try {
      await validateOrReject(data);
    } catch (errors) {
      this.logger.error(errors);
      throw new Error('Could not validate document');
    }
  }

  private isNfeTemplateMetadata(template: Template): template is Template<NfeTemplateMetadata> {
    return (
      'prompt' in template.metadata &&
      'modelConfigs' in template.metadata &&
      Array.isArray(template.metadata.modelConfigs) &&
      template.metadata.modelConfigs.every(
        (modelConfig) => 'model' in modelConfig && 'systemMessage' in modelConfig && 'config' in modelConfig,
      )
    );
  }

  private deepEqual(list: unknown[]): boolean {
    const firstItem = JSON.stringify(list[0]);
    return list.every((item) => JSON.stringify(item) === firstItem);
  }
}
