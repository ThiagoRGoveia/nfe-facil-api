import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { Global, HttpStatus, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { useDbUser } from '@lib/users/core/infra/tests/factories/users.factory';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { useRestModule } from '@/infra/tests/rest-integration-test.module';
import { createMock } from '@golevelup/ts-jest';
import { BatchProcess, BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { TemplatesModule } from '@lib/templates/templates.module';
import { ConfigService } from '@nestjs/config';
import { ZipPort } from 'libs/tooling/zip/src/core/zip.port';
import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { Readable } from 'stream';
import { useDbTemplate } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { DocumentsModule } from '@lib/documents/documents.module';
import { DocumentProcessorPort } from '@lib/documents/core/application/ports/document-processor.port';
import { WebhookNotifierPort } from '@lib/documents/core/application/ports/webhook-notifier.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { useDbFileRecord } from '@lib/documents/core/infra/tests/factories/file-process.factory';
import { FileProcessStatus } from '@lib/documents/core/domain/entities/file-records.entity';
import { ZipAdapter } from '@lib/zip/core/adapters/zip.adapter';
import { useDbBatchProcess } from '@lib/documents/core/infra/tests/factories/batch-process.factory';

jest.setTimeout(100000);

describe('DocumentsController (REST Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let user: User;
  let documentProcessor: jest.Mocked<DocumentProcessorPort>;
  let testZipBuffer: Buffer;
  let testPdfBuffer: Buffer;
  let queuePort: jest.Mocked<QueuePort>;

  @Global()
  @Module({
    providers: [
      {
        provide: ZipPort,
        useClass: ZipAdapter,
      },
    ],
    exports: [ZipPort],
  })
  class TestZipModule {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useRestModule(() => user), DocumentsModule, TemplatesModule, TestZipModule],
    })
      .overrideProvider(DocumentProcessorPort)
      .useValue(createMock<DocumentProcessorPort>())
      .overrideProvider(WebhookNotifierPort)
      .useValue(createMock<WebhookNotifierPort>())
      .overrideProvider(ConfigService)
      .useValue(
        createMock<ConfigService>({
          get: jest.fn().mockReturnValue('test-queue'),
        }),
      )
      .overrideProvider(FileStoragePort)
      .useValue(
        createMock<FileStoragePort>({
          get: jest.fn().mockResolvedValue(
            new Readable({
              read() {
                this.push('test');
                this.push(null);
              },
            }),
          ),
        }),
      )
      .compile();

    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    documentProcessor = module.get<jest.Mocked<DocumentProcessorPort>>(DocumentProcessorPort);
    queuePort = module.get<jest.Mocked<QueuePort>>(QueuePort);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

    await app.init();

    user = await useDbUser({ role: UserRole.ADMIN }, em);

    // Load the test files
    const testZipPath = path.join(__dirname, './test.zip');
    testZipBuffer = await fs.readFile(testZipPath);

    const testPdfPath = path.join(__dirname, './test.pdf');
    testPdfBuffer = await fs.readFile(testPdfPath);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /process/sync', () => {
    it('should create a new batch process with file', async () => {
      const template = await useDbTemplate({ user }, em);
      documentProcessor.process.mockResolvedValue(
        createMock<DocumentProcessResult>({
          status: 'SUCCESS',
          payload: {
            id: '123',
            name: 'test',
          },
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/documents/process/sync')
        .field('templateId', template.id)
        .attach('files', testZipBuffer, 'test.zip')
        .attach('files', testPdfBuffer, 'test.pdf');

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        template: { id: template.id },
        user: { id: user.id },
      });

      em.clear();
      // Verify database entry
      const batch = await em.findOne(BatchProcess, { id: response.body.id });
      expect(batch).toBeDefined();
      expect(batch?.template.id).toBe(template.id);

      await batch?.files.loadItems();
      // Verify files were processed correctly
      expect(batch?.files).toBeDefined();
      expect(batch?.files.length).toBe(3); // 2 from zip + 1 PDF

      expect(batch?.files[0].status).toBe(FileProcessStatus.COMPLETED);
      expect(batch?.files[0].fileName).toBe('test.pdf');
      expect(batch?.files[1].fileName).toBe('Test 1.pdf');
      expect(batch?.files[2].fileName).toBe('Test 2.pdf');
    });
  });

  describe('POST /documents/batch', () => {
    it('should create a batch process without file', async () => {
      const template = await useDbTemplate({ user }, em);

      const response = await request(app.getHttpServer()).post('/documents/batch').field('templateId', template.id);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        template: { id: template.id },
        user: { id: user.id },
      });

      em.clear();
      const batch = await em.findOne(BatchProcess, { id: response.body.id });
      expect(batch).toBeDefined();
      expect(batch?.template.id).toBe(template.id);
    });

    it('should create a batch process with file', async () => {
      const template = await useDbTemplate({ user }, em);

      const response = await request(app.getHttpServer())
        .post('/documents/batch')
        .field('templateId', template.id)
        .attach('files', testZipBuffer, 'test.zip')
        .attach('files', testPdfBuffer, 'test.pdf');

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        template: { id: template.id },
        user: { id: user.id },
      });

      em.clear();
      const batch = await em.findOne(BatchProcess, { id: response.body.id });
      expect(batch).toBeDefined();
      expect(batch?.template.id).toBe(template.id);

      await batch?.files.loadItems();
      expect(batch?.files).toBeDefined();
      expect(batch?.files.length).toBe(3);
    });

    it('should return 400 when no templateId is provided', async () => {
      await request(app.getHttpServer()).post('/documents/batch').expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when template is not found', async () => {
      await request(app.getHttpServer())
        .post('/documents/batch')
        .field('templateId', 'non-existent-id')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /documents/batch/:id', () => {
    it('should retrieve a batch process by ID', async () => {
      const template = await useDbTemplate({ user }, em);
      const batch = await useDbBatchProcess({ user, template }, em);

      const response = await request(app.getHttpServer()).get(`/documents/batch/${batch.id}`).expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: batch.id,
        template: { id: batch.template.id },
      });
    });

    it('should return 404 for non-existent batch', async () => {
      await request(app.getHttpServer()).get('/documents/batch/non-existent-id').expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PUT /documents/batch/:id/files', () => {
    it('should add file to existing batch', async () => {
      const template = await useDbTemplate({ user }, em);
      const batch = await useDbBatchProcess({ user, template, status: BatchStatus.CREATED, files: [] }, em);

      const response = await request(app.getHttpServer())
        .put(`/documents/batch/${batch.id}/files`)
        .attach('files', testZipBuffer, 'test.zip');

      expect(response.status).toBe(HttpStatus.OK);
      em.clear();
      const dbBatch = await em.findOne(BatchProcess, { id: batch.id });
      await dbBatch?.files.loadItems();
      expect(dbBatch?.files).toBeDefined();
      expect(dbBatch?.files.length).toBe(2);
    });

    it('should return 400 when no file is provided', async () => {
      const template = await useDbTemplate({ user }, em);
      const batch = await useDbBatchProcess({ user, template }, em);

      await request(app.getHttpServer()).put(`/documents/batch/${batch.id}/files`).expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /documents/batch/:id/process', () => {
    it('should start async batch processing', async () => {
      const template = await useDbTemplate({ user }, em);
      const batchProcess = await useDbBatchProcess({ user, template, status: BatchStatus.CREATED, files: [] }, em);
      await useDbFileRecord({ batchProcess, status: FileProcessStatus.PENDING, template, user }, em);
      await useDbFileRecord({ batchProcess, status: FileProcessStatus.PENDING, template, user }, em);

      await request(app.getHttpServer())
        .post(`/documents/batch/${batchProcess.id}/process`)
        .expect(HttpStatus.ACCEPTED);

      expect(queuePort.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE /documents/batch/:id', () => {
    it('should cancel batch process', async () => {
      const template = await useDbTemplate({ user }, em);
      const batch = await useDbBatchProcess({ user, template, status: BatchStatus.CREATED, files: [] }, em);

      await request(app.getHttpServer()).delete(`/documents/batch/${batch.id}`).expect(HttpStatus.NO_CONTENT);

      // Verify batch was cancelled
      em.clear();
      const cancelledBatch = await em.findOne(BatchProcess, { id: batch.id });
      expect(cancelledBatch?.status).toBe('CANCELLED');
    });
  });
});
