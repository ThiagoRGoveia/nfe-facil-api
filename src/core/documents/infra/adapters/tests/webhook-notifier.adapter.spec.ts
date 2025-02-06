import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { WebhookNotifierAdapter } from '../webhook-notifier.adapter';
import { NotifyWebhookUseCase } from '@/core/webhooks/application/use-cases/notify-webhook.use-case';
import { WebhookEvent } from '@/core/webhooks/domain/entities/webhook.entity';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { useFileProcessFactory } from '../../tests/factories/file-process.factory';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { EntityManager } from '@mikro-orm/postgresql';
import { useTemplateFactory } from '@/core/templates/infra/tests/factories/templates.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { PinoLogger } from 'nestjs-pino';

describe('WebhookNotifierAdapter', () => {
  let adapter: WebhookNotifierAdapter;
  let notifyWebhookUseCase: jest.Mocked<NotifyWebhookUseCase>;
  let em: EntityManager;
  let mockProcess: FileToProcess;
  let logger: jest.Mocked<PinoLogger>;

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
  });

  describe('notifySuccess', () => {
    it('should send document processed event with correct payload', async () => {
      const user = useUserFactory({}, em);
      const template = useTemplateFactory({ user }, em);
      mockProcess = useFileProcessFactory({ template: template }, em);

      await adapter.notifySuccess(mockProcess);

      expect(notifyWebhookUseCase.execute).toHaveBeenCalledWith({
        user: expect.any(Object),
        event: WebhookEvent.DOCUMENT_PROCESSED,
        payload: expect.objectContaining({
          documentId: mockProcess.id,
          fileName: mockProcess.fileName,
          status: mockProcess.status,
          processedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('notifyFailure', () => {
    it('should send document failed event with error details', async () => {
      const user = useUserFactory({}, em);
      const template = useTemplateFactory({ user }, em);
      const errorProcess = useFileProcessFactory({ error: 'Processing failed', template: template }, em);

      await adapter.notifyFailure(errorProcess);

      expect(notifyWebhookUseCase.execute).toHaveBeenCalledWith({
        user: user,
        event: WebhookEvent.DOCUMENT_FAILED,
        payload: expect.objectContaining({
          documentId: errorProcess.id,
          error: errorProcess.error,
          fileName: errorProcess.fileName,
          failedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getUserFromProcess', () => {
    it('should throw when template not found', async () => {
      const errorProcess = useFileProcessFactory(
        { error: 'Processing failed', template: useTemplateFactory({}, em) },
        em,
      );
      jest.spyOn(errorProcess.template, 'load').mockResolvedValue(null);

      await expect(adapter.notifyFailure(errorProcess)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw when user not found', async () => {
      const template = useTemplateFactory({ user: useUserFactory({}, em) }, em);
      const errorProcess = useFileProcessFactory({ error: 'Processing failed', template: template }, em);
      jest.spyOn(template.user!, 'load').mockResolvedValue(null);

      await expect(adapter.notifyFailure(errorProcess)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
