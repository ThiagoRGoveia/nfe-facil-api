import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@/core/users/domain/entities/user.entity';
import { UsersResolver } from '../users.resolver';
import { UsersModule } from '@/core/users/users.module';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useGraphqlModule } from '@/infra/tests/graphql-integration-test.module';
import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { AuthPort, AuthUserDto } from '@/infra/auth/ports/auth.port';

jest.setTimeout(100000);
describe('UsersResolver (Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let user: User;
  let authPort: jest.Mocked<AuthPort>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useGraphqlModule(() => user), UsersModule],
      providers: [UsersResolver],
    }).compile();

    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    authPort = module.get<jest.Mocked<AuthPort>>(AuthPort);

    await app.init();
    user = await useDbUser({}, em);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('findUserById', () => {
    it('should find a user by id', async () => {
      const findUserQuery = `
        query FindUser($id: String!) {
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
        query FindUser($id: String!) {
          findUserById(id: $id) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: findUserQuery,
          variables: { id: '99999' },
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
            totalPages
            pageSize
            page
            total
            items {
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
      expect(response.body.data.findAllUsers.total).toBeGreaterThan(0);
      expect(response.body.data.findAllUsers.items).toBeInstanceOf(Array);
      expect(response.body.data.findAllUsers.items.length).toBeGreaterThan(0);
    });
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      authPort.createUser.mockResolvedValue(
        createMock<AuthUserDto>({
          userId: faker.string.uuid(),
          email: 'test@example.com',
          emailVerified: false,
        }),
      );
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
        surname: 'Test User',
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
        mutation UpdateUser($id: String!, $input: UpdateUserDto!) {
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
        mutation DeleteUser($id: String!) {
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
        query FindUser($id: String!) {
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

  describe('updateUserPassword', () => {
    it('should update user password', async () => {
      authPort.updatePassword.mockResolvedValue(
        createMock<AuthUserDto>({
          userId: faker.string.uuid(),
          email: 'test@example.com',
          emailVerified: false,
        }),
      );
      const updatePasswordMutation = `
        mutation UpdateUserPassword($id: String!, $input: UpdatePasswordDto!) {
          updateUserPassword(id: $id, input: $input)
        }
      `;

      const updatePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updatePasswordMutation,
          variables: {
            id: user.id,
            input: updatePasswordData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.updateUserPassword).toBe(true);
    });

    it('should fail to update password for non-existent user', async () => {
      const updatePasswordMutation = `
        mutation UpdateUserPassword($id: String!, $input: UpdatePasswordDto!) {
          updateUserPassword(id: $id, input: $input)
        }
      `;

      const updatePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updatePasswordMutation,
          variables: {
            id: '99999',
            input: updatePasswordData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('User not found');
    });
  });
});
