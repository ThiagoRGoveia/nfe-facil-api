import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { DocumentProcessorPort } from '../../application/ports/document-processor.port';
import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { BaseWorkflow } from '@lib/workflows/_base.workflow';
import { NfeTextWorkflow } from '@lib/workflows/nfe/nfse-text.workflow';

@Injectable()
export class DocumentProcessorAdapter implements DocumentProcessorPort {
  private workflows: Map<string, BaseWorkflow>;
  constructor(nfeTextWorkflow: NfeTextWorkflow) {
    this.workflows = new Map([['nfe-json', nfeTextWorkflow]]);
  }

  process(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult> {
    const workflow = this.workflows.get(template.processCode);
    if (!workflow) {
      throw new InternalServerErrorException(`Workflow for template ${template.id} not found`);
    }
    return workflow.execute(fileBuffer, template);
  }
}

export const DocumentProcessorAdapterProvider = {
  provide: DocumentProcessorPort,
  useClass: DocumentProcessorAdapter,
};
