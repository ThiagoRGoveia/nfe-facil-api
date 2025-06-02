import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { TemplateDbPort } from '../../ports/templates-db.port';
import { CreateTemplateUseCase } from '../create-template.use-case';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { CreateTemplateDto } from '../../dtos/create-template.dto';
import { BadRequestException } from '@nestjs/common';

describe('CreateTemplateUseCase', () => {
  let useCase: CreateTemplateUseCase;
  let templateDbPort: jest.Mocked<TemplateDbPort>;
  let em: EntityManager;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CreateTemplateUseCase,
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            create: jest.fn().mockImplementation((data) => ({ ...data, id: '1' })),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<CreateTemplateUseCase>(CreateTemplateUseCase);
    templateDbPort = module.get(TemplateDbPort);
    em = module.get(EntityManager);

    testUser = useUserFactory({ id: '1', role: UserRole.CUSTOMER }, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const validDto: CreateTemplateDto = {
    name: 'Test Template',
    processCode: 'test-process',
    metadata: { fields: ['test'] },
    outputFormat: 'json',
    isPublic: false,
  };

  it('should create private template successfully', async () => {
    const result = await useCase.execute({
      user: testUser,
      data: validDto,
    });

    expect(templateDbPort.create).toHaveBeenCalledWith({
      ...validDto,
      user: testUser,
    });
    expect(templateDbPort.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining(validDto));
  });

  it('should prevent non-admins from creating public templates', async () => {
    await expect(
      useCase.execute({
        user: testUser,
        data: { ...validDto, isPublic: true },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow admins to create public templates', async () => {
    const adminUser = useUserFactory({ id: '2', role: UserRole.ADMIN }, em);

    const result = await useCase.execute({
      user: adminUser,
      data: { ...validDto, isPublic: true },
    });

    expect(result.isPublic).toBe(true);
  });

  it('should handle database errors', async () => {
    const error = new Error('Database failure');
    templateDbPort.save.mockRejectedValue(error);

    await expect(useCase.execute({ user: testUser, data: validDto })).rejects.toThrow(BadRequestException);
  });
});
