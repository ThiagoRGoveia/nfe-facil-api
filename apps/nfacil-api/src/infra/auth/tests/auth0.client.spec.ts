import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Auth0Client, Auth0UserMapper } from '../auth0.client';
import { ApiResponse, GetUsers200ResponseOneOfInner, ManagementClient } from 'auth0';
import { createMock } from '@golevelup/ts-jest';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('Auth0Client', () => {
  let client: Auth0Client;
  let configService: jest.Mocked<ConfigService>;
  let managementClientMock: jest.Mocked<ManagementClient>;

  beforeEach(async () => {
    managementClientMock = createMock<ManagementClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0Client,
        {
          provide: ConfigService,
          useValue: createMock<ConfigService>({
            get: jest.fn().mockReturnValue('test-env'),
          }),
        },
      ],
    }).compile();

    configService = module.get(ConfigService);
    client = module.get<Auth0Client>(Auth0Client);
    client.client = managementClientMock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if required config is missing', () => {
      configService.get.mockReturnValue(null);
      expect(() => new Auth0Client(configService)).toThrow('Missing required Auth0 configuration');
    });
  });

  describe('createUser', () => {
    it('should create user with correct parameters', async () => {
      const email = 'test@example.com';
      const password = 'test-password';

      const expectedUser = createMock<ApiResponse<GetUsers200ResponseOneOfInner>>({
        data: {
          user_id: 'user-id',
          email,
        },
      });

      jest.spyOn(client.client.users, 'create').mockResolvedValue(expectedUser);

      const result = await client.createUser(email, password);

      expect(result).toEqual(Auth0UserMapper.toDto(expectedUser.data));
      expect(managementClientMock.users.create).toHaveBeenCalledWith({
        email,
        password,
        connection: 'Username-Password-Authentication',
        email_verified: false,
      });
    });

    it('should throw BadRequestException when user already exists', async () => {
      const error = { statusCode: 409 };
      jest.spyOn(client.client.users, 'create').mockRejectedValue(error);

      await expect(client.createUser('test@example.com', 'password')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on validation error', async () => {
      const error = { statusCode: 400, message: 'Invalid email' };
      jest.spyOn(client.client.users, 'create').mockRejectedValue(error);

      await expect(client.createUser('test@example.com', 'password')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException on authentication error', async () => {
      const error = { statusCode: 401 };
      jest.spyOn(client.client.users, 'create').mockRejectedValue(error);

      await expect(client.createUser('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      const error = new Error('Unknown error');
      jest.spyOn(client.client.users, 'create').mockRejectedValue(error);

      await expect(client.createUser('test@example.com', 'password')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('disableUser', () => {
    it('should disable user with correct id', async () => {
      const userId = 'user-id';
      const expectedUser = createMock<ApiResponse<GetUsers200ResponseOneOfInner>>({
        data: {
          id: userId,
          blocked: true,
        },
      });

      jest.spyOn(client.client.users, 'update').mockResolvedValue(expectedUser);

      const result = await client.disableUser(userId);

      expect(result).toEqual(Auth0UserMapper.toDto(expectedUser.data));
      expect(managementClientMock.users.update).toHaveBeenCalledWith({ id: userId }, { blocked: true });
    });

    it('should throw NotFoundException when user not found', async () => {
      const error = { statusCode: 404 };
      jest.spyOn(client.client.users, 'update').mockRejectedValue(error);

      await expect(client.disableUser('user-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on validation error', async () => {
      const error = { statusCode: 400, message: 'Invalid user ID' };
      jest.spyOn(client.client.users, 'update').mockRejectedValue(error);

      await expect(client.disableUser('user-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException on authentication error', async () => {
      const error = { statusCode: 401 };
      jest.spyOn(client.client.users, 'update').mockRejectedValue(error);

      await expect(client.disableUser('user-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      const error = new Error('Unknown error');
      jest.spyOn(client.client.users, 'update').mockRejectedValue(error);

      await expect(client.disableUser('user-id')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user with correct id', async () => {
      const userId = 'user-id';
      const expectedUser = createMock<ApiResponse<void>>({
        data: undefined,
      });

      jest.spyOn(client.client.users, 'delete').mockResolvedValue(expectedUser);

      await client.deleteUser(userId);

      expect(managementClientMock.users.delete).toHaveBeenCalledWith({ id: userId });
    });

    it('should throw NotFoundException when user not found', async () => {
      const error = { statusCode: 404 };
      jest.spyOn(client.client.users, 'delete').mockRejectedValue(error);

      await expect(client.deleteUser('user-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on validation error', async () => {
      const error = { statusCode: 400, message: 'Invalid user ID' };
      jest.spyOn(client.client.users, 'delete').mockRejectedValue(error);

      await expect(client.deleteUser('user-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException on authentication error', async () => {
      const error = { statusCode: 401 };
      jest.spyOn(client.client.users, 'delete').mockRejectedValue(error);

      await expect(client.deleteUser('user-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      const error = new Error('Unknown error');
      jest.spyOn(client.client.users, 'delete').mockRejectedValue(error);

      await expect(client.deleteUser('user-id')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
