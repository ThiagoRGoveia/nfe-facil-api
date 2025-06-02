import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { TemplatesResolver } from '../templates.resolver';
import { TemplateDbPort } from '../../../../application/ports/templates-db.port';
import { Template } from '../../../../domain/entities/template.entity';
import { useTemplateFactory } from '../../../../infra/tests/factories/templates.factory';
import { EntityManager } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { Request } from '@lib/commons/types/express/request';
import { User, UserRole } from '@lib/users/core/domain/entities/user.entity';
import { CreateTemplateDto } from '@lib/templates/core/application/dtos/create-template.dto';
import { SortDirection } from '@lib/commons/dtos/sort.dto';
import { UpdateTemplateDto } from '@lib/templates/core/application/dtos/update-template.dto';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { GraphqlExpressContext } from '@/infra/graphql/types/context.type';
import { CreateTemplateUseCase } from '@lib/templates/core/application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from '@lib/templates/core/application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from '@lib/templates/core/application/use-cases/delete-template.use-case';

describe('TemplatesResolver', () => {
  let resolver: TemplatesResolver;
  let templateDbPort: jest.Mocked<TemplateDbPort>;
  let createTemplateUseCase: jest.Mocked<CreateTemplateUseCase>;
  let updateTemplateUseCase: jest.Mocked<UpdateTemplateUseCase>;
  let deleteTemplateUseCase: jest.Mocked<DeleteTemplateUseCase>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        TemplatesResolver,
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            findById: jest.fn(),
            findAll: jest.fn(),
            findByUser: jest.fn(),
          }),
        },
        {
          provide: CreateTemplateUseCase,
          useValue: createMock<CreateTemplateUseCase>(),
        },
        {
          provide: UpdateTemplateUseCase,
          useValue: createMock<UpdateTemplateUseCase>(),
        },
        {
          provide: DeleteTemplateUseCase,
          useValue: createMock<DeleteTemplateUseCase>(),
        },
        {
          provide: EntityManager,
          useValue: createMock<EntityManager>(),
        },
      ],
    }).compile();

    resolver = module.get(TemplatesResolver);
    templateDbPort = module.get(TemplateDbPort);
    createTemplateUseCase = module.get(CreateTemplateUseCase);
    updateTemplateUseCase = module.get(UpdateTemplateUseCase);
    deleteTemplateUseCase = module.get(DeleteTemplateUseCase);
    em = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findTemplateById', () => {
    it('should return a template by id', async () => {
      const template = useTemplateFactory({ id: '1' }, em);
      templateDbPort.findByIdOrFail.mockResolvedValue(template);

      const result = await resolver.findTemplateById('1');
      expect(result).toEqual(template);
      expect(templateDbPort.findByIdOrFail).toHaveBeenCalledWith('1');
    });
  });

  describe('findAllTemplates', () => {
    it('should return all templates for admin users', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.ADMIN }),
        }),
      });
      const paginatedResponse = createMock<PaginatedResponse<Template>>({
        items: [useTemplateFactory({}, em)],
      });
      const filters = { filters: [] };
      const pagination = { page: 1, pageSize: 10 };
      const sort = { field: 'id', direction: SortDirection.ASC };

      templateDbPort.findAll.mockResolvedValue(paginatedResponse);
      const result = await resolver.findAllTemplates(mockCtx, filters, pagination, sort);

      expect(result).toEqual(paginatedResponse);
      expect(templateDbPort.findAll).toHaveBeenCalledWith(filters.filters, pagination, sort);
    });

    it('should return only owned templates for customer users', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });
      const paginatedResponse = createMock<PaginatedResponse<Template>>({
        items: [useTemplateFactory({}, em)],
      });
      const filters = { filters: [] };
      const pagination = { page: 1, pageSize: 10 };
      const sort = { field: 'id', direction: SortDirection.ASC };

      templateDbPort.findByUser.mockResolvedValue(paginatedResponse);
      const result = await resolver.findAllTemplates(mockCtx, filters, pagination, sort);

      expect(result).toEqual(paginatedResponse);
      expect(templateDbPort.findByUser).toHaveBeenCalledWith('1', filters.filters, pagination, sort);
    });
  });

  describe('createTemplate', () => {
    it('should create a template', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });
      const input = createMock<CreateTemplateDto>({ name: 'Test Template' });
      const expected = useTemplateFactory({ id: '1' }, em);

      createTemplateUseCase.execute.mockResolvedValue(expected);
      const result = await resolver.createTemplate(mockCtx, input);

      expect(result).toEqual(expected);
      expect(createTemplateUseCase.execute).toHaveBeenCalledWith({
        user: mockCtx.req.user,
        data: input,
      });
    });
  });

  describe('updateTemplate', () => {
    it('should update a template', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });
      const input = createMock<UpdateTemplateDto>({ name: 'Updated Name' });
      const updatedTemplate = useTemplateFactory({ id: '1', name: 'Updated Name' }, em);

      updateTemplateUseCase.execute.mockResolvedValue(updatedTemplate);
      const result = await resolver.updateTemplate(mockCtx, '1', input);

      expect(result).toEqual(updatedTemplate);
      expect(updateTemplateUseCase.execute).toHaveBeenCalledWith({
        user: mockCtx.req.user,
        id: '1',
        data: input,
      });
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      const mockCtx = createMock<GraphqlExpressContext>({
        req: createMock<Request>({
          user: createMock<User>({ id: '1', role: UserRole.CUSTOMER }),
        }),
      });

      const result = await resolver.deleteTemplate(mockCtx, '1');
      expect(result).toBe(true);
      expect(deleteTemplateUseCase.execute).toHaveBeenCalledWith({
        user: mockCtx.req.user,
        id: '1',
      });
    });
  });
});
