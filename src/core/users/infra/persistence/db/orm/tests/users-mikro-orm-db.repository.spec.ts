import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { UserMikroOrmDbRepository } from '../users-mikro-orm-db.repository';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { CreateUserDto } from '@/core/users/application/dtos/create-user.dto';
import { UpdateUserDto } from '@/core/users/application/dtos/update-user.dto';

describe('UserMikroOrmDbRepository (unit)', () => {
  let orm: MikroORM;
  let em: EntityManager;
  let repository: UserMikroOrmDbRepository;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [UserMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<UserMikroOrmDbRepository>(UserMikroOrmDbRepository);
    testUser = useUserFactory({ id: 1 }, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user entity', () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        surname: 'Smith',
        clientId: 123,
        credits: 1000,
        role: UserRole.CUSTOMER,
      };

      const user = repository.create(userData);

      expect(user).toBeInstanceOf(User);
      expect(user.name).toBe(userData.name);
      expect(user.surname).toBe(userData.surname);
      expect(user.clientId).toBe(userData.clientId);
      expect(user.credits).toBe(userData.credits);
      expect(user.role).toBe(userData.role);
    });
  });

  describe('update', () => {
    it('should update an existing user entity', () => {
      const updateData: UpdateUserDto = {
        name: 'Updated Name',
        surname: 'Updated Surname',
        credits: 2000,
      };

      const updatedUser = repository.update(testUser, updateData);

      expect(updatedUser).toBe(testUser); // Should return the same instance
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.surname).toBe(updateData.surname);
      expect(updatedUser.credits).toBe(updateData.credits);
      // Other fields should remain unchanged
      expect(updatedUser.clientId).toBe(testUser.clientId);
      expect(updatedUser.role).toBe(testUser.role);
    });

    it('should handle partial updates', () => {
      const partialUpdateData: UpdateUserDto = {
        name: 'Updated Name',
      };

      const updatedUser = repository.update(testUser, partialUpdateData);

      expect(updatedUser).toBe(testUser);
      expect(updatedUser.name).toBe(partialUpdateData.name);
      // Other fields should remain unchanged
      expect(updatedUser.surname).toBe(testUser.surname);
      expect(updatedUser.credits).toBe(testUser.credits);
      expect(updatedUser.clientId).toBe(testUser.clientId);
      expect(updatedUser.role).toBe(testUser.role);
    });
  });
});
