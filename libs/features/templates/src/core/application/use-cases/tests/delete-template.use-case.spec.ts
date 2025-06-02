import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { TemplateDbPort } from '../../ports/templates-db.port';
import { DeleteTemplateUseCase } from '../delete-template.use-case';
import { User, UserRole } from '@lib/users/core/domain/entities/user.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { useTemplateFactory } from '@/core/templates/infra/tests/factories/templates.factory';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Template } from '@lib/templates/core/domain/entities/template.entity';

describe('DeleteTemplateUseCase', () => {
  let useCase: DeleteTemplateUseCase;
  let templateDbPort: jest.Mocked<TemplateDbPort>;
  let em: EntityManager;
  let testUser: User;
  let testTemplate: Template;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        DeleteTemplateUseCase,
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            findById: jest.fn(),
            delete: jest.fn().mockResolvedValue(undefined),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<DeleteTemplateUseCase>(DeleteTemplateUseCase);
    templateDbPort = module.get(TemplateDbPort);
    em = module.get(EntityManager);

    testUser = useUserFactory({ id: '1', role: UserRole.ADMIN }, em);
    testTemplate = useTemplateFactory({ id: '1', user: testUser }, em);
  });

  it('should delete owned template', async () => {
    templateDbPort.findById.mockResolvedValue(useTemplateFactory({ id: '1', user: testUser, isPublic: false }, em));

    await useCase.execute({
      user: testUser,
      id: testTemplate.id,
    });

    expect(templateDbPort.delete).toHaveBeenCalledWith(testTemplate.id);
  });

  it('should prevent deleting non-existent templates', async () => {
    templateDbPort.findById.mockResolvedValue(null);

    await expect(useCase.execute({ user: testUser, id: '999' })).rejects.toThrow(NotFoundException);
  });

  it('should prevent deleting others templates', async () => {
    const otherUser = useUserFactory({ id: '2', role: UserRole.CUSTOMER }, em);
    templateDbPort.findById.mockResolvedValue(testTemplate);

    await expect(useCase.execute({ user: otherUser, id: testTemplate.id })).rejects.toThrow(BadRequestException);
  });

  it('should allow admins to delete any template', async () => {
    const adminUser = useUserFactory({ id: '3', role: UserRole.ADMIN }, em);
    templateDbPort.findById.mockResolvedValue(testTemplate);

    await useCase.execute({
      user: adminUser,
      id: testTemplate.id,
    });

    expect(templateDbPort.delete).toHaveBeenCalled();
  });
});
