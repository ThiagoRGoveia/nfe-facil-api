import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { WebhookNotifierAdapter } from '../webhook-notifier.adapter';
import { NotifyWebhookUseCase } from '@/core/webhooks/application/use-cases/notify-webhook.use-case';
import { WebhookEvent } from '@/core/webhooks/domain/entities/webhook.entity';
import { FileRecord } from '@/core/documents/domain/entities/file-records.entity';
import { useFileRecordFactory } from '../../tests/factories/file-process.factory';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { EntityManager } from '@mikro-orm/postgresql';
import { useTemplateFactory } from '@/core/templates/infra/tests/factories/templates.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { PinoLogger } from 'nestjs-pino';
import { DatePort } from '@/infra/adapters/date.adapter';

describe('WebhookNotifierAdapter', () => {
  let adapter: WebhookNotifierAdapter;
  let notifyWebhookUseCase: jest.Mocked<NotifyWebhookUseCase>;
  let em: EntityManager;
  let mockProcess: FileRecord;
  let logger: jest.Mocked<PinoLogger>;
  let datePort: jest.Mocked<DatePort>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        WebhookNotifierAdapter,
        {
          provide: NotifyWebhookUseCase,
          useValue: createMock<NotifyWebhookUseCase>({
            execute: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    adapter = module.get<WebhookNotifierAdapter>(WebhookNotifierAdapter);
    notifyWebhookUseCase = module.get(NotifyWebhookUseCase);
    em = module.get<EntityManager>(EntityManager);
    logger = module.get<jest.Mocked<PinoLogger>>(PinoLogger);
    datePort = module.get<jest.Mocked<DatePort>>(DatePort);
  });

  describe('notifySuccess', () => {
    it('should send document processed event with correct payload', async () => {
      const user = useUserFactory({}, em);
      const template = useTemplateFactory({ user }, em);
      mockProcess = useFileRecordFactory({ template: template, user }, em);
      const mockDate = new Date();
      datePort.now.mockReturnValue(mockDate);
      await adapter.notifySuccess(mockProcess);

      expect(notifyWebhookUseCase.execute).toHaveBeenCalledWith({
        user: user,
        event: WebhookEvent.DOCUMENT_PROCESSED,
        payload: {
          documentId: mockProcess.id,
          fileName: mockProcess.fileName,
          status: mockProcess.status,
          processedAt: mockDate,
          result: mockProcess.result,
        },
      });
    });
  });

  describe('notifyFailure', () => {
    it('should send document failed event with error details', async () => {
      const user = useUserFactory({}, em);
      const template = useTemplateFactory({ user }, em);
      const mockDate = new Date();
      datePort.now.mockReturnValue(mockDate);
      const errorProcess = useFileRecordFactory({ error: 'Processing failed', template: template, user }, em);

      await adapter.notifyFailure(errorProcess);

      expect(notifyWebhookUseCase.execute).toHaveBeenCalledWith({
        user: user,
        event: WebhookEvent.DOCUMENT_FAILED,
        payload: {
          documentId: errorProcess.id,
          error: errorProcess.error,
          fileName: errorProcess.fileName,
          failedAt: mockDate,
        },
      });
    });
  });

  describe('getUserFromProcess', () => {
    it('should throw when user not found', async () => {
      const template = useTemplateFactory({ user: useUserFactory({}, em) }, em);
      const errorProcess = useFileRecordFactory({ error: 'Processing failed', template: template }, em);
      jest.spyOn(template.user!, 'load').mockResolvedValue(null);

      await expect(adapter.notifyFailure(errorProcess)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
