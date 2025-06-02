import { Test, TestingModule } from '@nestjs/testing';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { EntityManager, RequiredEntityData } from '@mikro-orm/postgresql';
import { UserMikroOrmDbRepository } from '../users-mikro-orm-db.repository';
import { User, UserRole } from '@lib/users/core/domain/entities/user.entity';
import { UpdateUserDto } from '@/core/users/application/dtos/update-user.dto';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';

describe('UserMikroOrmDbRepository', () => {
  let repository: UserMikroOrmDbRepository;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [UserMikroOrmDbRepository],
    }).compile();

    repository = module.get<UserMikroOrmDbRepository>(UserMikroOrmDbRepository);
    em = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', () => {
      // Arrange
      const userData: RequiredEntityData<User> = {
        name: 'John',
        surname: 'Doe',
        credits: 100,
        email: 'john.doe@example.com',
        role: UserRole.CUSTOMER,
        clientId: 'test-client-id',
        clientSecret: 'TEST-CLIENT-SECRET',
        auth0Id: 'test-auth0-id',
      };

      // Act
      const user = repository.create(userData);

      // Assert
      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.surname).toBe(userData.surname);
      expect(user.email).toBe(userData.email);
      expect(user.credits).toBe(userData.credits);
      expect(user.role).toBe(userData.role);
      expect(user.clientId).toBe(userData.clientId);
      expect(user.clientSecret).toBe(userData.clientSecret);
    });
  });

  describe('update', () => {
    it('should update a user', () => {
      // Arrange
      const user = useUserFactory({ id: '1' }, em);
      const updateData: UpdateUserDto = {
        name: 'Updated John',
        email: 'updated.john@example.com',
      };

      // Act
      const updatedUser = repository.update(user.id, updateData);

      // Assert
      expect(updatedUser.name).toBe(updateData.name);
    });
  });

  describe('findByClientId', () => {
    it('should find a user by client ID', async () => {
      // Arrange
      jest
        .spyOn(repository, 'findByClientId')
        .mockResolvedValueOnce(useUserFactory({ clientId: 'test-client-id' }, em));

      // Act
      const foundUser = await repository.findByClientId('test-client-id');

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser?.clientId).toBe('test-client-id');
    });

    it('should return null when user not found', async () => {
      // Act
      jest.spyOn(repository, 'findByClientId').mockResolvedValueOnce(null);
      const foundUser = await repository.findByClientId('non-existent-id');

      // Assert
      expect(foundUser).toBeNull();
    });
  });
});
