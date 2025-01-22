import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@/core/users/domain/entities/user.entity';
import { UsersResolver } from '../users.resolver';
import { UsersModule } from '@/core/users/users.module';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useDbSchema, useDbRefresh } from '@/infra/tests/db-schema.seed';
import { useGraphqlModule } from '@/infra/tests/graphql-integration-test.module';

describe('UsersResolver (Integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let user: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useGraphqlModule(() => user), UsersModule],
      providers: [UsersResolver],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    await useDbSchema(orm);
    await app.init();
    user = await useDbUser({}, em);
  });

  afterEach(async () => {
    await useDbRefresh(orm);
    await app.close();
  });

  describe('findUserById', () => {
    it('should find a user by id', async () => {
      const findUserQuery = `
        query FindUser($id: Float!) {
          findUserById(id: $id) {
            id
            name
            email
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: findUserQuery,
          variables: { id: user.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findUserById).toBeDefined();
      expect(response.body.data.findUserById.id).toBe(user.id);
    });

    it('should return null for non-existent user', async () => {
      const findUserQuery = `
        query FindUser($id: Float!) {
          findUserById(id: $id) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: findUserQuery,
          variables: { id: 99999 },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findUserById).toBeNull();
    });
  });

  describe('findAllUsers', () => {
    it('should fetch all users', async () => {
      // Create another user to ensure we have multiple records
      await useDbUser({}, em);

      const findAllUsersQuery = `
        query FindAllUsers {
          findAllUsers {
            count
            data {
              id
              name
              email
            }
          }
        }
      `;

      const response = await request(app.getHttpServer()).post('/graphql').send({
        query: findAllUsersQuery,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findAllUsers).toBeDefined();
      expect(response.body.data.findAllUsers.count).toBeGreaterThan(0);
      expect(response.body.data.findAllUsers.data).toBeInstanceOf(Array);
      expect(response.body.data.findAllUsers.data.length).toBeGreaterThan(0);
    });
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      const createUserMutation = `
        mutation CreateUser($input: CreateUserDto!) {
          createUser(input: $input) {
            id
            name
            email
          }
        }
      `;

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createUserMutation,
          variables: { input: userData },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createUser).toBeDefined();
      expect(response.body.data.createUser.name).toBe(userData.name);
      expect(response.body.data.createUser.email).toBe(userData.email);
    });
  });

  describe('updateUser', () => {
    it('should successfully update a user', async () => {
      const updateUserMutation = `
        mutation UpdateUser($id: Float!, $input: UpdateUserDto!) {
          updateUser(id: $id, input: $input) {
            id
            name
            email
          }
        }
      `;

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateUserMutation,
          variables: {
            id: user.id,
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.updateUser).toBeDefined();
      expect(response.body.data.updateUser.name).toBe(updateData.name);
      expect(response.body.data.updateUser.email).toBe(updateData.email);
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete a user', async () => {
      const deleteUserMutation = `
        mutation DeleteUser($id: Float!) {
          deleteUser(id: $id)
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: deleteUserMutation,
          variables: { id: user.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteUser).toBe(true);

      // Verify user is deleted
      const findUserQuery = `
        query FindUser($id: Float!) {
          findUserById(id: $id) {
            id
          }
        }
      `;

      const verifyResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: findUserQuery,
          variables: { id: user.id },
        });

      expect(verifyResponse.body.data.findUserById).toBeNull();
    });
  });
});
