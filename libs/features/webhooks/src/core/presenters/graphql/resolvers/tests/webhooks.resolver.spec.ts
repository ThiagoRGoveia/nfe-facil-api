import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { WebhooksResolver } from '../webhooks.resolver';
import { Webhook } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { useWebhookFactory } from '@lib/webhooks/core/infra/tests/factories/webhooks.factory';
import { EntityManager } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { Request } from '@lib/commons/types/express/request';
import { User, UserRole } from '@lib/users/core/domain/entities/user.entity';
import { SortDirection } from '@lib/commons/dtos/sort.dto';

import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { GraphqlExpressContext } from '@lib/commons/graphql/types/context.type';

import { CreateWebhookDto } from '@lib/webhooks/core/application/dtos/create-webhook.dto';
import { UpdateWebhookDto } from '@lib/webhooks/core/application/dtos/update-webhook.dto';
import { WebhookDbPort } from '@lib/webhooks/core/application/ports/webhook-db.port';
import { CreateWebhookUseCase } from '@lib/webhooks/core/application/use-cases/create-webhook.use-case';
import { UpdateWebhookUseCase } from '@lib/webhooks/core/application/use-cases/update-webhook.use-case';
import { DeleteWebhookUseCase } from '@lib/webhooks/core/application/use-cases/delete-webhook.use-case';

describe('WebhooksResolver', () => {
  let resolver: WebhooksResolver;
  let webhookDbPort: jest.Mocked<WebhookDbPort>;
  let createWebhookUseCase: jest.Mocked<CreateWebhookUseCase>;
  let updateWebhookUseCase: jest.Mocked<UpdateWebhookUseCase>;
  let deleteWebhookUseCase: jest.Mocked<DeleteWebhookUseCase>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        WebhooksResolver,
        {
          provide: WebhookDbPort,
          useValue: createMock<WebhookDbPort>({
            findById: jest.fn(),
            findAll: jest.fn(),
            findByUser: jest.fn(),
          }),
        },
        {
          provide: CreateWebhookUseCase,
          useValue: createMock<CreateWebhookUseCase>(),
        },
        {
          provide: UpdateWebhookUseCase,
          useValue: createMock<UpdateWebhookUseCase>(),
        },
        {
          provide: DeleteWebhookUseCase,
          useValue: createMock<DeleteWebhookUseCase>(),
        },
        {
          provide: EntityManager,
          useValue: createMock<EntityManager>(),
        },
      ],
    }).compile();

    resolver = module.get(WebhooksResolver);
    webhookDbPort = module.get(WebhookDbPort);
    createWebhookUseCase = module.get(CreateWebhookUseCase);
    updateWebhookUseCase = module.get(UpdateWebhookUseCase);
    deleteWebhookUseCase = module.get(DeleteWebhookUseCase);
    em = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findWebhookById', () => {
    it('should return a webhook by id', async () => {
      const webhook = useWebhookFactory({ id: '1' }, em);
      webhookDbPort.findByIdOrFail.mockResolvedValue(webhook);

      const result = await resolver.findWebhookById('1');
      expect(result).toEqual(webhook);
      expect(webhookDbPort.findByIdOrFail).toHaveBeenCalledWith('1');
    });
  });

  describe('findAllWebhooks', () => {
    it('should return all webhooks for admin users', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.ADMIN }),
        }),
      });
      const paginatedResponse = createMock<PaginatedResponse<Webhook>>({
        items: [useWebhookFactory({}, em)],
      });
      const filters = { filters: [] };
      const pagination = { page: 1, pageSize: 10 };
      const sort = { field: 'id', direction: SortDirection.ASC };

      webhookDbPort.findAll.mockResolvedValue(paginatedResponse);
      const result = await resolver.findAllWebhooks(mockCtx, filters, pagination, sort);

      expect(result).toEqual(paginatedResponse);
      expect(webhookDbPort.findAll).toHaveBeenCalledWith(filters.filters, pagination, sort);
    });

    it('should return only user webhooks for customer users', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });
      const paginatedResponse = createMock<PaginatedResponse<Webhook>>({
        items: [useWebhookFactory({}, em)],
      });
      const filters = { filters: [] };
      const pagination = { page: 1, pageSize: 10 };
      const sort = { field: 'id', direction: SortDirection.ASC };

      webhookDbPort.findByUser.mockResolvedValue(paginatedResponse);
      const result = await resolver.findAllWebhooks(mockCtx, filters, pagination, sort);

      expect(result).toEqual(paginatedResponse);
      expect(webhookDbPort.findByUser).toHaveBeenCalledWith('1', filters.filters, pagination, sort);
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });
      const input = createMock<CreateWebhookDto>({ url: 'https://example.com/webhook' });
      const expected = useWebhookFactory({ id: '1' }, em);

      createWebhookUseCase.execute.mockResolvedValue(expected);
      const result = await resolver.createWebhook(mockCtx, input);

      expect(result).toEqual(expected);
      expect(createWebhookUseCase.execute).toHaveBeenCalledWith({
        user: mockCtx.req.user,
        data: input,
      });
    });
  });

  describe('updateWebhook', () => {
    it('should update a webhook', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });
      const input = createMock<UpdateWebhookDto>({ url: 'https://updated.com/webhook' });
      const updatedWebhook = useWebhookFactory({ id: '1', url: 'https://updated.com/webhook' }, em);

      updateWebhookUseCase.execute.mockResolvedValue(updatedWebhook);
      const result = await resolver.updateWebhook(mockCtx, '1', input);

      expect(result).toEqual(updatedWebhook);
      expect(updateWebhookUseCase.execute).toHaveBeenCalledWith({
        user: mockCtx.req.user,
        id: '1',
        data: input,
      });
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });

      const result = await resolver.deleteWebhook(mockCtx, '1');
      expect(result).toBe(true);
      expect(deleteWebhookUseCase.execute).toHaveBeenCalledWith({
        user: mockCtx.req.user,
        id: '1',
      });
    });
  });
});
