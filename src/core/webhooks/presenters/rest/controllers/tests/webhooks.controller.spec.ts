import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { WebhooksController } from '../webhooks.controller';
import { HttpStatus } from '@nestjs/common';
import { Request } from '@/infra/express/types/request';
import { RestQueryDto } from '@/infra/dtos/rest.query.dto';
import { UserRole } from '@/core/users/domain/entities/user.entity';
import { Webhook, WebhookEvent } from '@/core/webhooks/domain/entities/webhook.entity';
import { useWebhookFactory } from '@/core/webhooks/infra/tests/factories/webhooks.factory';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateWebhookUseCase, DeleteWebhookUseCase, UpdateWebhookUseCase } from '@/core/webhooks/webhooks.module';
import { WebhookDbPort } from '@/core/webhooks/application/ports/webhook-db.port';
import { CreateWebhookDto } from '@/core/webhooks/application/dtos/create-webhook.dto';
import { UpdateWebhookDto } from '@/core/webhooks/application/dtos/update-webhook.dto';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { SortDirection } from '@/infra/dtos/sort.dto';
import { NotifyWebhookUseCase } from '@/core/webhooks/application/use-cases/notify-webhook.use-case';
import { NotifyWebhookDto } from '@/core/webhooks/application/dtos/notify-webhook.dto';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let createWebhookUseCase: jest.Mocked<CreateWebhookUseCase>;
  let updateWebhookUseCase: jest.Mocked<UpdateWebhookUseCase>;
  let deleteWebhookUseCase: jest.Mocked<DeleteWebhookUseCase>;
  let webhookDbPort: jest.Mocked<WebhookDbPort>;
  let em: EntityManager;
  let notifyWebhookUseCase: jest.Mocked<NotifyWebhookUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      controllers: [WebhooksController],
      providers: [
        { provide: CreateWebhookUseCase, useValue: createMock<CreateWebhookUseCase>() },
        { provide: UpdateWebhookUseCase, useValue: createMock<UpdateWebhookUseCase>() },
        { provide: DeleteWebhookUseCase, useValue: createMock<DeleteWebhookUseCase>() },
        {
          provide: WebhookDbPort,
          useValue: createMock<WebhookDbPort>({
            findById: jest.fn(),
            findAll: jest.fn(),
            findByUser: jest.fn(),
          }),
        },
        { provide: NotifyWebhookUseCase, useValue: createMock<NotifyWebhookUseCase>() },
      ],
    }).compile();

    controller = module.get(WebhooksController);
    createWebhookUseCase = module.get(CreateWebhookUseCase);
    updateWebhookUseCase = module.get(UpdateWebhookUseCase);
    deleteWebhookUseCase = module.get(DeleteWebhookUseCase);
    em = module.get<EntityManager>(EntityManager);
    webhookDbPort = module.get(WebhookDbPort);
    notifyWebhookUseCase = module.get(NotifyWebhookUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a webhook', async () => {
      const createDto = createMock<CreateWebhookDto>();
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '1', role: UserRole.CUSTOMER }),
      });
      const expected = useWebhookFactory({ id: '1' }, em);

      createWebhookUseCase.execute.mockResolvedValue(expected);
      const result = await controller.create(mockReq, createDto);

      expect(result).toEqual(expected);
      expect(createWebhookUseCase.execute).toHaveBeenCalledWith({
        user: mockReq.user,
        data: createDto,
      });
    });
  });

  describe('findOne', () => {
    it('should find a webhook by id', async () => {
      const webhook = useWebhookFactory({ id: '1' }, em);
      webhookDbPort.findByIdOrFail.mockResolvedValue(webhook);

      const result = await controller.findOne('1');
      expect(result).toEqual(webhook);
      expect(webhookDbPort.findByIdOrFail).toHaveBeenCalledWith('1');
    });
  });

  describe('findAll', () => {
    it('should handle admin user query', async () => {
      const mockReq = createMock<Request>({ user: createMock<{ role: UserRole }>({ role: UserRole.ADMIN }) });
      const query = createMock<RestQueryDto>({
        page: 1,
        pageSize: 10,
        sortField: 'id',
        sortDirection: SortDirection.ASC,
      });
      const paginatedResponse = createMock<PaginatedResponse<Webhook>>({
        items: [useWebhookFactory({}, em)],
      });

      query.toPagination = jest.fn().mockReturnValue({ page: 1, pageSize: 10 });
      query.toSort = jest.fn().mockReturnValue({ field: 'id', direction: SortDirection.ASC });
      webhookDbPort.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(mockReq, query);
      expect(result).toEqual(paginatedResponse);
      expect(webhookDbPort.findAll).toHaveBeenCalledWith(undefined, query.toPagination(), query.toSort());
    });

    it('should handle regular user query', async () => {
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '2', role: UserRole.CUSTOMER }),
      });
      const query = createMock<RestQueryDto>();
      const paginatedResponse = createMock<PaginatedResponse<Webhook>>({
        items: [useWebhookFactory({}, em)],
      });

      query.toPagination = jest.fn().mockReturnValue({ page: 1, limit: 10 });
      query.toSort = jest.fn().mockReturnValue({ field: 'id', direction: SortDirection.ASC });
      webhookDbPort.findByUser.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(mockReq, query);
      expect(result).toEqual(paginatedResponse);
      expect(webhookDbPort.findByUser).toHaveBeenCalledWith(
        mockReq.user.id,
        undefined,
        query.toPagination(),
        query.toSort(),
      );
    });
  });

  describe('update', () => {
    it('should update a webhook', async () => {
      const updateDto = createMock<UpdateWebhookDto>({
        url: 'https://updated.com/webhook',
        events: [WebhookEvent.DOCUMENT_PROCESSED],
      });
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '1', role: UserRole.CUSTOMER }),
      });
      const updatedWebhook = useWebhookFactory({ id: '1' }, em);

      updateWebhookUseCase.execute.mockResolvedValue(updatedWebhook);
      const result = await controller.update(mockReq, '1', updateDto);

      expect(result).toEqual(updatedWebhook);
      expect(updateWebhookUseCase.execute).toHaveBeenCalledWith({
        user: mockReq.user,
        id: '1',
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a webhook', async () => {
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '1', role: UserRole.CUSTOMER }),
      });

      await controller.remove(mockReq, '1');
      expect(deleteWebhookUseCase.execute).toHaveBeenCalledWith({
        user: mockReq.user,
        id: '1',
      });
      expect(HttpStatus.NO_CONTENT);
    });
  });

  describe('notify', () => {
    it('should trigger webhook notifications', async () => {
      const notifyDto = createMock<NotifyWebhookDto>({
        event: WebhookEvent.DOCUMENT_PROCESSED,
        payload: { data: 'test' },
      });

      await controller.notify(notifyDto);
      expect(notifyWebhookUseCase.execute).toHaveBeenCalledWith(notifyDto);
    });
  });
});
