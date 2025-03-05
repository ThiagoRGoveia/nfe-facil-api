import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { DocumentProcessorPort } from '../../application/ports/document-processor.port';
import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { NfeTextWorkflow } from '@doc/workflows/nfe/nfse-text.workflow';
import { BaseWorkflow } from '@doc/workflows/_base.workflow';

@Injectable()
export class DocumentProcessorAdapter implements DocumentProcessorPort {
  private workflows: Map<string, BaseWorkflow>;
  constructor(nfeTextWorkflow: NfeTextWorkflow) {
    this.workflows = new Map([['nfe-json', nfeTextWorkflow]]);
  }

  async process(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult> {
    const workflow = this.workflows.get(template.processCode);
    if (!workflow) {
      throw new InternalServerErrorException(`Workflow for template ${template.id} not found`);
    }
    return workflow.execute(fileBuffer, template);
  }
}
