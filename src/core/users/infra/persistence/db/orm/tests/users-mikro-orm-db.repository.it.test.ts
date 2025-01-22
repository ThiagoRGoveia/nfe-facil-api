import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';
import { useDbRefresh, useDbSchema } from '@/infra/tests/db-schema.seed';
import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { UserMikroOrmDbRepository } from '../users-mikro-orm-db.repository';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { CreateUserDto } from '@/core/users/application/dtos/create-user.dto';
import { UpdateUserDto } from '@/core/users/application/dtos/update-user.dto';

describe('UserMikroOrmDbRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: UserMikroOrmDbRepository;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [UserMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<UserMikroOrmDbRepository>(UserMikroOrmDbRepository);
    app = module.createNestApplication();

    await app.init();
    await useDbSchema(orm);
  });

  afterEach(async () => {
    await useDbRefresh(orm);
    await app.close();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData: CreateUserDto = {
        name: 'John Doe',
        surname: 'Smith',
        clientId: 123,
        credits: 1000,
        role: UserRole.CUSTOMER,
      };

      const user = repository.create(userData);
      await em.persistAndFlush(user);

      expect(user.id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.surname).toBe(userData.surname);
      expect(user.clientId).toBe(userData.clientId);
      expect(user.credits).toBe(userData.credits);
      expect(user.role).toBe(userData.role);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      testUser = await useDbUser({ id: 1 }, em);
      const updateData: UpdateUserDto = {
        name: 'Updated Name',
        surname: 'Updated Surname',
        credits: 2000,
      };

      const updatedUser = repository.update(testUser, updateData);
      await em.persistAndFlush(updatedUser);

      expect(updatedUser.id).toBe(testUser.id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.surname).toBe(updateData.surname);
      expect(updatedUser.credits).toBe(updateData.credits);
      // Other fields should remain unchanged
      expect(updatedUser.clientId).toBe(testUser.clientId);
      expect(updatedUser.role).toBe(testUser.role);
    });
  });
});
