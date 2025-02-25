import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';
import { ProcessDocumentJobService } from '../process-document-job.service';
import { DocumentsModule } from 'apps/api/src/core/documents/documents.module';
import { DocumentProcessorPort } from 'apps/api/src/core/documents/application/ports/document-processor.port';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { User } from '@/core/users/domain/entities/user.entity';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useDbTemplate } from '@/core/templates/infra/tests/factories/templates.factory';
import { useDbFileProcess } from '@/core/documents/infra/tests/factories/file-process.factory';
import { FileProcessStatus, FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { TemplatesModule } from '@/core/templates/templates.module';
import { WebhooksModule } from '@/core/webhooks/webhooks.module';
import { HttpClientPort } from '@/core/webhooks/application/ports/http-client.port';
import { createMock } from '@golevelup/ts-jest';
import { Webhook, WebhookAuthType, WebhookEvent, WebhookStatus } from '@/core/webhooks/domain/entities/webhook.entity';
import { useDbWebhook } from '@/core/webhooks/infra/tests/factories/webhooks.factory';
import { ConfigService } from '@nestjs/config';
import { useDbBatchProcess } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { BatchProcess, BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { HandleOutputFormatUseCase } from '@/core/documents/application/use-cases/handle-output-format.use-case';
import { DatePort } from '@/infra/adapters/date.adapter';
jest.setTimeout(30000);

const mockBuffer = Buffer.from('test-data');
const mockDate = new Date('2025-01-01T00:00:00.000Z');

describe('ProcessDocumentJobService (Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let service: ProcessDocumentJobService;
  let testUser: User;
  let testTemplate: Template;
  let testWebhook: Webhook;
  let mockDocumentProcessorPort: DocumentProcessorPort;
  let mockHttpClientPort: HttpClientPort;
  let mockDatePort: jest.Mocked<DatePort>;
  let mockHandleOutputFormatUseCase: HandleOutputFormatUseCase;
  beforeEach(async () => {
    // Create mock for DocumentProcessorPort
    mockDocumentProcessorPort = createMock<DocumentProcessorPort>({
      process: jest.fn().mockResolvedValue(
        DocumentProcessResult.fromSuccess({
          data: 'test-data',
          processed: true,
        }),
      ),
    });

    mockHttpClientPort = createMock<HttpClientPort>({
      request: jest.fn().mockResolvedValue({
        status: 200,
        data: 'test-data',
        headers: {},
      }),
    });

    mockHandleOutputFormatUseCase = createMock<HandleOutputFormatUseCase>({
      execute: jest.fn().mockResolvedValue({
        json: 'test-json',
        csv: 'test-csv',
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule, DocumentsModule, TemplatesModule, WebhooksModule],
      providers: [ProcessDocumentJobService],
    })
      .overrideProvider(DocumentProcessorPort)
      .useValue(mockDocumentProcessorPort)
      .overrideProvider(HttpClientPort)
      .useValue(mockHttpClientPort)
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('test-env'),
      })
      .overrideProvider(FileStoragePort)
      .useValue(
        createMock<FileStoragePort>({
          getBuffer: jest.fn().mockResolvedValue(mockBuffer),
        }),
      )
      .overrideProvider(HandleOutputFormatUseCase)
      .useValue(mockHandleOutputFormatUseCase)
      .compile();

    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    service = module.get<ProcessDocumentJobService>(ProcessDocumentJobService);
    mockDatePort = module.get<jest.Mocked<DatePort>>(DatePort);

    await app.init();

    // Create test entities
    testUser = await useDbUser({}, em);
    testTemplate = await useDbTemplate({ user: testUser }, em);

    // Create webhook for test user
    testWebhook = await useDbWebhook(
      {
        user: testUser,
        events: [WebhookEvent.DOCUMENT_PROCESSED],
        status: WebhookStatus.ACTIVE,
        authType: WebhookAuthType.NONE,
        headers: { 'test-header': 'test-value' },
      },
      em,
    );
  });

  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  describe('processMessage', () => {
    it('should successfully process a valid message with fileId and trigger webhook', async () => {
      // Create a file process entity
      const batch = await useDbBatchProcess(
        { user: testUser, template: testTemplate, totalFiles: 1, processedFiles: 0 },
        em,
      );
      const fileProcess = await useDbFileProcess(
        {
          batchProcess: batch,
          template: testTemplate,
          user: testUser,
          status: FileProcessStatus.PENDING,
        },
        em,
      );

      // Mock time
      mockDatePort.now.mockReturnValue(mockDate);

      em.clear();

      // Test processing a message with the file ID
      const result = await service.processMessage({ fileId: fileProcess.id });

      // Assertions
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.processedAt).toBeDefined();
      expect(mockDocumentProcessorPort.process).toHaveBeenCalledWith(mockBuffer, testTemplate);

      // Verify webhook call was made
      expect(mockHttpClientPort.request).toHaveBeenCalledWith({
        url: testWebhook.url,
        auth: undefined,
        method: 'POST',
        timeout: testWebhook.timeout,
        headers: {
          ...testWebhook.headers,
          'Content-Type': 'application/json',
        },
        body: {
          documentId: fileProcess.id,
          status: FileProcessStatus.COMPLETED,
          fileName: fileProcess.fileName,
          processedAt: mockDate,
          result: {
            data: 'test-data',
            processed: true,
          },
        },
      });

      const updatedFileProcess = await em.findOne(FileToProcess, { id: fileProcess.id });
      const updatedBatchProcess = await em.findOne(BatchProcess, { id: batch.id });
      expect(updatedFileProcess).toBeDefined();
      expect(updatedFileProcess?.status).toBe(FileProcessStatus.COMPLETED);
      expect(updatedBatchProcess).toBeDefined();
      expect(updatedBatchProcess?.processedFiles).toBe(1);
      expect(updatedBatchProcess?.status).toBe(BatchStatus.COMPLETED);
      expect(mockHandleOutputFormatUseCase.execute).toHaveBeenCalledWith(updatedBatchProcess);
    });

    it('should not trigger webhook if webhook is inactive', async () => {
      // Create an inactive webhook
      await useDbWebhook(
        {
          user: testUser,
          events: [WebhookEvent.DOCUMENT_PROCESSED],
          status: WebhookStatus.INACTIVE,
        },
        em,
      );

      // Create a file process entity
      const fileProcess = await useDbFileProcess(
        {
          template: testTemplate,
          user: testUser,
          status: FileProcessStatus.PENDING,
        },
        em,
      );

      em.clear();
      // Process the message
      await service.processMessage({ fileId: fileProcess.id });

      // Only the active webhook should be triggered
      expect(mockHttpClientPort.request).toHaveBeenCalledTimes(1);
    });

    it('should not trigger webhook for events it does not subscribe to', async () => {
      // Create webhook that only listens for DOCUMENT_FAILED events
      await useDbWebhook(
        {
          user: testUser,
          events: [WebhookEvent.DOCUMENT_FAILED],
          status: WebhookStatus.ACTIVE,
        },
        em,
      );

      // Create a file process entity
      const fileProcess = await useDbFileProcess(
        {
          template: testTemplate,
          user: testUser,
          status: FileProcessStatus.PENDING,
        },
        em,
      );

      em.clear();
      // Test processing the message
      await service.processMessage({ fileId: fileProcess.id });

      // Our original DOCUMENT_PROCESSED webhook should be triggered, but not the DOCUMENT_FAILED one
      expect(mockHttpClientPort.request).toHaveBeenCalledTimes(1);
    });

    it('should not handle output format if batch is not completed', async () => {
      // Create a file process entity
      const batch = await useDbBatchProcess(
        { user: testUser, template: testTemplate, totalFiles: 2, processedFiles: 0 },
        em,
      );
      const fileProcess = await useDbFileProcess(
        {
          batchProcess: batch,
          template: testTemplate,
          user: testUser,
          status: FileProcessStatus.PENDING,
        },
        em,
      );

      em.clear();
      // Test processing the message
      await service.processMessage({ fileId: fileProcess.id });

      expect(mockHandleOutputFormatUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw an error for invalid message without fileId', async () => {
      // Test with invalid message
      await expect(service.processMessage({})).rejects.toThrow('Invalid message: missing fileId in message body');
    });

    it('should throw an error when fileId is not found', async () => {
      // Test with non-existent fileId
      await expect(service.processMessage({ fileId: 'non-existent-id' })).rejects.toThrow();
    });
  });
});
