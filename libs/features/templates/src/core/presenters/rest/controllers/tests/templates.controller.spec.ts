import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { TemplateController } from '../templates.controller';
import { HttpStatus } from '@nestjs/common';
import { Request } from '@/infra/express/types/request';
import { RestQueryDto } from '@/infra/dtos/rest.query.dto';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { SortDirection } from '@/infra/dtos/sort.dto';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { CreateTemplateDto } from '@lib/templates/core/application/dtos/create-template.dto';
import { UpdateTemplateDto } from '@lib/templates/core/application/dtos/update-template.dto';
import { CreateTemplateUseCase } from '@lib/templates/core/application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from '@lib/templates/core/application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from '@lib/templates/core/application/use-cases/delete-template.use-case';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';

describe('TemplateController', () => {
  let controller: TemplateController;
  let createTemplateUseCase: jest.Mocked<CreateTemplateUseCase>;
  let updateTemplateUseCase: jest.Mocked<UpdateTemplateUseCase>;
  let deleteTemplateUseCase: jest.Mocked<DeleteTemplateUseCase>;
  let templateDbPort: jest.Mocked<TemplateDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      controllers: [TemplateController],
      providers: [
        { provide: CreateTemplateUseCase, useValue: createMock<CreateTemplateUseCase>() },
        { provide: UpdateTemplateUseCase, useValue: createMock<UpdateTemplateUseCase>() },
        { provide: DeleteTemplateUseCase, useValue: createMock<DeleteTemplateUseCase>() },
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            findById: jest.fn(),
            findAll: jest.fn(),
            findByUser: jest.fn(),
          }),
        },
      ],
    }).compile();

    controller = module.get(TemplateController);
    createTemplateUseCase = module.get(CreateTemplateUseCase);
    updateTemplateUseCase = module.get(UpdateTemplateUseCase);
    deleteTemplateUseCase = module.get(DeleteTemplateUseCase);
    em = module.get<EntityManager>(EntityManager);
    templateDbPort = module.get(TemplateDbPort);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const createDto = createMock<CreateTemplateDto>();
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '1', role: UserRole.CUSTOMER }),
      });
      const expected = useTemplateFactory({ id: '1' }, em);

      createTemplateUseCase.execute.mockResolvedValue(expected);
      const result = await controller.create(mockReq, createDto);

      expect(result).toEqual(expected);
      expect(createTemplateUseCase.execute).toHaveBeenCalledWith({
        user: mockReq.user,
        data: createDto,
      });
    });
  });

  describe('findOne', () => {
    it('should find a template by id', async () => {
      const template = useTemplateFactory({ id: '1' }, em);
      templateDbPort.findByIdOrFail.mockResolvedValue(template);

      const result = await controller.findOne('1');
      expect(result).toEqual(template);
      expect(templateDbPort.findByIdOrFail).toHaveBeenCalledWith('1');
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
      const paginatedResponse = createMock<PaginatedResponse<Template>>({
        items: [useTemplateFactory({}, em)],
      });

      query.toPagination = jest.fn().mockReturnValue({ page: 1, pageSize: 10 });
      query.toSort = jest.fn().mockReturnValue({ field: 'id', direction: SortDirection.ASC });
      templateDbPort.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(mockReq, query);
      expect(result).toEqual(paginatedResponse);
      expect(templateDbPort.findAll).toHaveBeenCalledWith(undefined, query.toPagination(), query.toSort());
    });

    it('should handle admin user query with default sort', async () => {
      const mockReq = createMock<Request>({ user: createMock<{ role: UserRole }>({ role: UserRole.ADMIN }) });
      const query = createMock<RestQueryDto>();
      const paginatedResponse = createMock<PaginatedResponse<Template>>({
        items: [useTemplateFactory({}, em)],
      });

      query.toPagination = jest.fn().mockReturnValue({ page: 1, pageSize: 10 });
      query.toSort = jest.fn().mockReturnValue(undefined);
      templateDbPort.findAll.mockResolvedValue(paginatedResponse);
      const result = await controller.findAll(mockReq, query);
      expect(result).toEqual(paginatedResponse);
      expect(templateDbPort.findAll).toHaveBeenCalledWith(undefined, query.toPagination(), {
        field: 'createdAt',
        direction: SortDirection.DESC,
      });
    });

    it('should handle regular user query', async () => {
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '2', role: UserRole.CUSTOMER }),
      });
      const query = createMock<RestQueryDto>();
      const paginatedResponse = createMock<PaginatedResponse<Template>>({
        items: [useTemplateFactory({}, em)],
      });

      query.toPagination = jest.fn().mockReturnValue({ page: 1, limit: 10 });
      query.toSort = jest.fn().mockReturnValue({ field: 'id', direction: SortDirection.ASC });
      templateDbPort.findByUser.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(mockReq, query);
      expect(result).toEqual(paginatedResponse);
      expect(templateDbPort.findByUser).toHaveBeenCalledWith(
        mockReq.user.id,
        undefined,
        query.toPagination(),
        query.toSort(),
      );
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const updateDto = createMock<UpdateTemplateDto>({
        name: 'Test Template',
        processCode: 'test-process-code',
        metadata: {
          fields: ['field1', 'field2'],
        },
      });
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '1', role: UserRole.CUSTOMER }),
      });
      const updatedTemplate = useTemplateFactory({ id: '1' }, em);

      updateTemplateUseCase.execute.mockResolvedValue(updatedTemplate);
      const result = await controller.update(mockReq, '1', updateDto);

      expect(result).toEqual(updatedTemplate);
      expect(updateTemplateUseCase.execute).toHaveBeenCalledWith({
        user: mockReq.user,
        id: '1',
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a template', async () => {
      const mockReq = createMock<Request>({
        user: createMock<{ id: string; role: UserRole }>({ id: '1', role: UserRole.CUSTOMER }),
      });

      await controller.remove(mockReq, '1');
      expect(deleteTemplateUseCase.execute).toHaveBeenCalledWith({
        user: mockReq.user,
        id: '1',
      });
      expect(HttpStatus.NO_CONTENT);
    });
  });
});
