import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { DocumentProcessorPort } from '../../application/ports/document-processor.port';
import { FileToProcess } from '../../domain/entities/file-process.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { NfeTextWorkflow } from '@doc/workflows/nfe/nfe-text.workflow';
import { BaseWorkflow } from '@doc/workflows/_base.workflow';

export class DocumentProcessorAdapter implements DocumentProcessorPort {
  private workflows: Map<string, BaseWorkflow>;
  constructor(private readonly nfeTextWorkflow: NfeTextWorkflow) {
    this.workflows = new Map([['nfe-text', this.nfeTextWorkflow]]);
  }

  async process(file: FileToProcess, template: Template): Promise<DocumentProcessResult> {
    const workflow = this.workflows.get(template.processCode);
    if (!workflow) {
      throw new InternalServerErrorException(`Workflow for template ${template.id} not found`);
    }
    return workflow.execute(file);
  }
}
