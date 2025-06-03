import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { WebhookNotifierAdapter } from '../webhook-notifier.adapter';
import { WebhookEvent } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { FileRecord } from '@lib/documents/core/domain/entities/file-records.entity';
import { useFileRecordFactory } from '../../tests/factories/file-process.factory';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { EntityManager } from '@mikro-orm/postgresql';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { PinoLogger } from 'nestjs-pino';
import { DatePort } from '@lib/date/core/date.adapter';
import { NotifyWebhookUseCase } from '@lib/webhook-dispatcher/core/application/use-cases/notify-webhook.use-case';

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
