import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { TemplateDbPort } from '../../ports/templates-db.port';
import { UpdateTemplateUseCase } from '../update-template.use-case';
import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { useTemplateFactory } from '@/core/templates/infra/tests/factories/templates.factory';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateTemplateDto } from '../../dtos/update-template.dto';
import { Template } from '@/core/templates/domain/entities/template.entity';

describe('UpdateTemplateUseCase', () => {
  let useCase: UpdateTemplateUseCase;
  let templateDbPort: jest.Mocked<TemplateDbPort>;
  let em: EntityManager;
  let testUser: User;
  let testTemplate: Template;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UpdateTemplateUseCase,
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            findById: jest.fn(),
            update: jest.fn().mockImplementation((id, data) => ({ ...testTemplate, ...data })),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<UpdateTemplateUseCase>(UpdateTemplateUseCase);
    templateDbPort = module.get(TemplateDbPort);
    em = module.get(EntityManager);

    testUser = useUserFactory({ id: '1' }, em);
    testTemplate = useTemplateFactory({ id: '1', owner: testUser }, em);
  });

  const validUpdate: UpdateTemplateDto = {
    name: 'Updated Name',
    metadata: { fields: ['new-field'] },
    outputFormat: 'xml',
  };

  it('should update owned template', async () => {
    templateDbPort.findById.mockResolvedValue(testTemplate);
    em.clear();
    const updatedTemplate = useTemplateFactory({ ...testTemplate, ...validUpdate }, em);
    templateDbPort.update.mockReturnValue(updatedTemplate);

    const result = await useCase.execute({
      user: testUser,
      id: testTemplate.id,
      data: validUpdate,
    });

    expect(result.name).toBe(validUpdate.name);
    expect(templateDbPort.update).toHaveBeenCalledWith(testTemplate.id, validUpdate);
    expect(templateDbPort.save).toHaveBeenCalled();
  });

  it('should prevent updating non-existent templates', async () => {
    templateDbPort.findById.mockResolvedValue(null);

    await expect(useCase.execute({ user: testUser, id: '999', data: validUpdate })).rejects.toThrow(NotFoundException);
  });

  it('should validate template ownership', async () => {
    const otherUser = useUserFactory({ id: '2', role: UserRole.CUSTOMER }, em);
    templateDbPort.findById.mockResolvedValue(testTemplate);

    await expect(useCase.execute({ user: otherUser, id: testTemplate.id, data: validUpdate })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should handle database errors', async () => {
    templateDbPort.findById.mockResolvedValue(testTemplate);
    const error = new Error('Database failure');
    templateDbPort.save.mockRejectedValue(error);

    await expect(useCase.execute({ user: testUser, id: testTemplate.id, data: validUpdate })).rejects.toThrow(
      BadRequestException,
    );
  });
});
