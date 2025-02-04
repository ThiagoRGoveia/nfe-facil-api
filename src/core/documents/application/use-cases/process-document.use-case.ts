import { BadRequestException, Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { DocumentProcess, DocumentProcessStatus } from '../../domain/entities/document-process.entity';
import { FileStorage } from '@/infra/aws/s3/ports/file-storage.port';
import { DocumentProcessorPort } from '../../ports/document-processor.port';
import { WebhookNotifierPort } from '../../ports/webhook-notifier.port';
import { TemplateDbPort } from '@/core/templates/templates.module';
import { DocumentProcessDbPort } from '../ports/document-process-db.port';
import { User } from '@/core/users/domain/entities/user.entity';
import { ConfigService } from '@nestjs/config';

// The interface for the input parameters for this use case
export interface ProcessDocumentParams {
  user: User;
  templateId: string;
  file: {
    originalname: string; // For example "invoice.pdf"
    stream: Readable; // The file content buffer or any file type defined in your system
    mimetype?: string;
  };
  webhookUrl?: string;
}

@Injectable()
export class ProcessDocumentUseCase {
  private readonly documentBucketName: string;
  constructor(
    private readonly documentTemplatePort: TemplateDbPort,
    private readonly fileStoragePort: FileStorage,
    private readonly documentProcessDbPort: DocumentProcessDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly webhookNotifierPort: WebhookNotifierPort,
    private readonly configService: ConfigService,
  ) {
    const documentBucketName = this.configService.get('DOCUMENT_BUCKET_NAME');
    if (!documentBucketName) {
      throw new Error('DOCUMENT_BUCKET_NAME is not set');
    }
    this.documentBucketName = documentBucketName;
  }

  async execute(params: ProcessDocumentParams): Promise<DocumentProcess> {
    // 1. Validate template existence and user access
    const template = await this.documentTemplatePort.findById(params.templateId);
    if (!template) {
      // If the template is not found, throw immediately
      throw new BadRequestException('Template not found');
    }

    // Additional access validation if needed:
    if (!template.isAccessibleByUser(params.user)) {
      throw new BadRequestException("You don't have access to this template");
    }

    // 2. Create a new document process record with status "pending"
    const documentProcess = this.documentProcessDbPort.create({
      template: template,
      fileName: params.file.originalname,
      webhookUrl: params.webhookUrl,
      status: DocumentProcessStatus.PENDING,
    });

    // 3. Upload the PDF document to S3
    let filePath: string;
    try {
      filePath = await this.fileStoragePort.uploadFromStream(
        this.documentBucketName,
        `uploads/${documentProcess.id}/${params.file.originalname}`,
        params.file.stream,
        params.file.mimetype,
      );
    } catch (uploadError) {
      // Mark process as failed if S3 upload fails
      documentProcess.markFailed(uploadError.message);

      // Send a failure webhook notification if a webhook URL was provided
      if (params.webhookUrl) {
        await this.webhookNotifierPort.notifyFailure(documentProcess);
      }
      throw new BadRequestException('Failed to store document');
    }

    // 4. Update the process record with the S3 file key and persist the change
    documentProcess.setFilePath(filePath);

    await this.documentProcessDbPort.save();

    // 5. Initiate asynchronous document processing
    await this.documentProcessorPort.process(documentProcess.id, filePath, template);

    return documentProcess;
  }
}
