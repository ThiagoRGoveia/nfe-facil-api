import { RequiredEntityData } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateMikroOrmDbRepository } from '../templates-mikro-orm-db.repository';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';

describe('TemplateMikroOrmDbRepository (unit)', () => {
  let em: EntityManager;
  let repository: TemplateMikroOrmDbRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [TemplateMikroOrmDbRepository],
    }).compile();

    em = module.get(EntityManager);
    repository = module.get<TemplateMikroOrmDbRepository>(TemplateMikroOrmDbRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new template', () => {
      // Arrange
      const user = useUserFactory({ id: '1' }, em);
      const templateData: RequiredEntityData<Template> = {
        name: 'Test Template',
        processCode: 'test-process',
        metadata: { fields: ['test'] },
        outputFormat: 'json',
        isPublic: false,
        user: user,
      };

      const createSpy = jest.spyOn(em, 'create');
      const persistSpy = jest.spyOn(em, 'persist');

      // Act
      const result = repository.create(templateData);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(Template, templateData);
      expect(persistSpy).toHaveBeenCalledWith(result);
      expect(result).toBeInstanceOf(Template);
      expect(result.name).toBe(templateData.name);
      expect(result.processCode).toBe(templateData.processCode);
      expect(result.metadata).toEqual(templateData.metadata);
      expect(result.outputFormat).toBe(templateData.outputFormat);
      expect(result.isPublic).toBe(templateData.isPublic);
      expect(result.user?.unwrap()).toBe(user);
    });
  });

  describe('update', () => {
    it('should update an existing template', () => {
      // Arrange
      const templateId = '1';
      const updateData: Partial<RequiredEntityData<Template>> = {
        name: 'Updated Template',
        metadata: { fields: ['updated'] },
      };

      const existingTemplate = new Template();
      const getReferenceSpy = jest.spyOn(em, 'getReference').mockReturnValue(existingTemplate);
      const assignSpy = jest.spyOn(em, 'assign');

      // Act
      const result = repository.update(templateId, updateData);

      // Assert
      expect(getReferenceSpy).toHaveBeenCalledWith(Template, templateId);
      expect(assignSpy).toHaveBeenCalledWith(existingTemplate, updateData);
      expect(result).toBe(existingTemplate);
    });
  });

  describe('findById', () => {
    it('should find template by id', async () => {
      // Arrange
      const templateId = '1';
      const template = new Template();
      const findOneSpy = jest.spyOn(em, 'findOne').mockResolvedValue(template);

      // Act
      const result = await repository.findById(templateId);

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith(Template, { id: templateId });
      expect(result).toBe(template);
    });

    it('should return null if template not found', async () => {
      // Arrange
      const templateId = '999';
      jest.spyOn(em, 'findOne').mockResolvedValue(null);

      // Act
      const result = await repository.findById(templateId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete template by id', async () => {
      // Arrange
      const templateId = '1';
      const template = new Template();
      const getReferenceSpy = jest.spyOn(em, 'getReference').mockReturnValue(template);
      const removeAndFlushSpy = jest.spyOn(em, 'removeAndFlush').mockResolvedValue(undefined);

      // Act
      await repository.delete(templateId);

      // Assert
      expect(getReferenceSpy).toHaveBeenCalledWith(Template, templateId);
      expect(removeAndFlushSpy).toHaveBeenCalledWith(template);
    });
  });
});
