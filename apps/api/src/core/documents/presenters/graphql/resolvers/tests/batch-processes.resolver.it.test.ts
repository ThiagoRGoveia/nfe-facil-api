import * as request from 'supertest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { useGraphqlModule } from '@/infra/tests/graphql-integration-test.module';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { useDbBatchProcess } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { BatchProcess, BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-records.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { MAX_FILE_SIZE_BYTES } from '@/infra/constants/max-file-size.constant';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { ZipPort } from '@/infra/zip/zip.port';
import { ZipAdapter } from '@/infra/zip/zip.adapter';
import { TemplatesModule } from '@/core/templates/templates.module';
import { DocumentsModule } from '@/core/documents/documents.module';
import { WebhookNotifierPort } from '@/core/documents/application/ports/webhook-notifier.port';
import { DocumentProcessorPort } from '@/core/documents/application/ports/document-processor.port';
import { ConfigService } from '@nestjs/config';
import { useDbTemplate } from '@/core/templates/infra/tests/factories/templates.factory';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { Readable } from 'stream';

jest.setTimeout(100000);
describe('BatchProcesses Resolver (integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let user: User;
  let template: Template;
  let batchDbPort: BatchDbPort;
  let documentProcessor: jest.Mocked<DocumentProcessorPort>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useGraphqlModule(() => user), DocumentsModule, TemplatesModule],
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
      .overrideProvider(ZipPort)
      .useValue(new ZipAdapter())
      .compile();

    em = module.get(EntityManager);
    app = module.createNestApplication();
    batchDbPort = module.get(BatchDbPort);
    documentProcessor = module.get<jest.Mocked<DocumentProcessorPort>>(DocumentProcessorPort);
    app.use(graphqlUploadExpress({ maxFileSize: MAX_FILE_SIZE_BYTES, maxFiles: 10 }));
    await app.init();

    // Create test user and template
    user = await useDbUser({ role: UserRole.CUSTOMER }, em);
    template = await useDbTemplate({ user }, em);
  });

  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  it('should create a batch process and return its details using file upload', async () => {
    const createBatchMutation = `
      mutation ProcessBatchSync($input: CreateBatchInput!) {
        processBatchSync(input: $input) {
          id
          status
          processedFiles
          totalFiles
          template {
            id
            name
          }
          user {
            id
          }
        }
      }
    `;

    documentProcessor.process.mockResolvedValue(
      createMock<DocumentProcessResult>({
        status: 'SUCCESS',
        payload: {
          id: '123',
          name: 'test',
        },
      }),
    );

    const testZipPath = path.join(__dirname, './test.zip');
    const testZipBuffer = await fs.readFile(testZipPath);

    const testPdfPath = path.join(__dirname, './test.pdf');
    const testPdfBuffer = await fs.readFile(testPdfPath);

    // Modified file upload handling for multiple files
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .field(
        'operations',
        JSON.stringify({
          query: createBatchMutation,
          variables: {
            input: {
              templateId: template.id,
              files: [null, null], // Now accepts array of files
            },
          },
        }),
      )
      .field(
        'map',
        JSON.stringify({
          '0': ['variables.input.files.0'],
          '1': ['variables.input.files.1'],
        }),
      )
      .attach('0', testZipBuffer, 'test.zip')
      .attach('1', testPdfBuffer, 'test.pdf')
      .expect(({ body }) => {
        expect(body.errors).toBeUndefined();
        expect(body.data.processBatchSync).toBeDefined();
        expect(body.data.processBatchSync.status).toBe(BatchStatus.COMPLETED);
        expect(body.data.processBatchSync.template.id).toBe(template.id);
        expect(body.data.processBatchSync.user.id).toBe(user.id);
        expect(body.data.processBatchSync.totalFiles).toBe(3);
        expect(body.data.processBatchSync.processedFiles).toBe(3);
      })
      .expect(200);

    em.clear();
    // Verify database entry
    const batch = await em.findOne(BatchProcess, { id: response.body.data.processBatchSync.id });
    expect(batch).toBeDefined();
    expect(batch?.template.id).toBe(template.id);

    await batch?.files.loadItems();
    // Verify file was processed correctly
    expect(batch?.files).toBeDefined();
    expect(batch?.files.length).toBe(3); // Since we know test.zip contains 4 files

    expect(batch?.files[0].status).toBe(FileProcessStatus.COMPLETED);
    expect(batch?.files[0].result).toEqual({
      id: '123',
      name: 'test',
    });
  });

  it('should find a batch process by ID', async () => {
    const mockBatchProcess = await useDbBatchProcess(
      {
        id: 'test-batch-id',
        status: BatchStatus.CREATED,
        processedFiles: 0,
        totalFiles: 1,
        template,
        user,
      },
      em,
    );

    const findByIdQuery = `
      query FindBatchProcessById($id: String!) {
        findBatchProcessById(id: $id) {
          id
          status
          processedFiles
          totalFiles
          template {
            id
            name
          }
          user {
            id
          }
        }
      }
    `;

    jest.spyOn(batchDbPort, 'findByIdOrFail').mockResolvedValue(mockBatchProcess);

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: findByIdQuery,
        variables: { id: mockBatchProcess.id },
      })
      .expect(({ body }) => {
        expect(body.errors).toBeUndefined();
        expect(body.data.findBatchProcessById).toBeDefined();
        expect(body.data.findBatchProcessById.id).toBe(mockBatchProcess.id);
        expect(body.data.findBatchProcessById.status).toBe(BatchStatus.CREATED);
        expect(body.data.findBatchProcessById.template.id).toBe(template.id);
        expect(body.data.findBatchProcessById.user.id).toBe(user.id);
      })
      .expect(200);
  });

  it('should find all batch processes with pagination and filters', async () => {
    const mockBatchProcesses = [
      await useDbBatchProcess(
        {
          id: 'batch-1',
          status: BatchStatus.CREATED,
          template,
          user,
        },
        em,
      ),
      await useDbBatchProcess(
        {
          id: 'batch-2',
          status: BatchStatus.COMPLETED,
          template,
          user,
        },
        em,
      ),
    ];

    const findAllQuery = `
      query FindAllBatchProcesses($filters: Filters, $pagination: Pagination, $sort: Sort) {
        findAllBatchProcesses(filters: $filters, pagination: $pagination, sort: $sort) {
          total
          page
          pageSize
          totalPages
          items {
            id
            status
            template {
              id
            }
            user {
              id
            }
          }
        }
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: findAllQuery,
        variables: {
          pagination: { page: 1, pageSize: 10 },
          filters: { filters: [{ field: 'status', value: 'CREATED' }] },
        },
      })
      .expect(({ body }) => {
        expect(body.errors).toBeUndefined();
        expect(body.data.findAllBatchProcesses).toBeDefined();
        expect(body.data.findAllBatchProcesses.total).toBe(1);
        expect(body.data.findAllBatchProcesses.page).toBe(1);
        expect(body.data.findAllBatchProcesses.pageSize).toBe(10);
        expect(body.data.findAllBatchProcesses.totalPages).toBe(1);
        expect(body.data.findAllBatchProcesses.items).toHaveLength(1);
        expect(body.data.findAllBatchProcesses.items[0].id).toBe(mockBatchProcesses[0].id);
      })
      .expect(200);
  });
});
