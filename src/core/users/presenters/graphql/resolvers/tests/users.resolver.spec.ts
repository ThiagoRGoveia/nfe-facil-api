import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from '../users.resolver';
import { UserDbPort } from '../../../../application/ports/users-db.port';
import { CreateUserUseCase } from '../../../../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../../../application/use-cases/delete-user.use-case';
import { User, UserRole } from '../../../../domain/entities/user.entity';
import { CreateUserDto } from '../../../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../../../application/dtos/update-user.dto';
import { UpdatePasswordDto } from '../../../../application/dtos/update-password.dto';
import { useUserFactory } from '../../../../infra/tests/factories/users.factory';
import { EntityManager } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { createMock } from '@golevelup/ts-jest';
import { RefreshClientSecretUseCase } from '../../../../application/use-cases/refresh-client-secret.use-case';
import { UpdatePasswordUseCase } from '../../../../application/use-cases/update-password.use-case';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let userDbPort: jest.Mocked<UserDbPort>;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let updateUserUseCase: jest.Mocked<UpdateUserUseCase>;
  let deleteUserUseCase: jest.Mocked<DeleteUserUseCase>;
  let refreshClientSecretUseCase: jest.Mocked<RefreshClientSecretUseCase>;
  let updatePasswordUseCase: jest.Mocked<UpdatePasswordUseCase>;
  let mockUser: User;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UsersResolver,
        {
          provide: UserDbPort,
          useValue: createMock<UserDbPort>(),
        },
        {
          provide: CreateUserUseCase,
          useValue: createMock<CreateUserUseCase>(),
        },
        {
          provide: UpdateUserUseCase,
          useValue: createMock<UpdateUserUseCase>(),
        },
        {
          provide: DeleteUserUseCase,
          useValue: createMock<DeleteUserUseCase>(),
        },
        {
          provide: RefreshClientSecretUseCase,
          useValue: createMock<RefreshClientSecretUseCase>(),
        },
        {
          provide: UpdatePasswordUseCase,
          useValue: createMock<UpdatePasswordUseCase>(),
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    userDbPort = module.get(UserDbPort);
    createUserUseCase = module.get(CreateUserUseCase);
    updateUserUseCase = module.get(UpdateUserUseCase);
    deleteUserUseCase = module.get(DeleteUserUseCase);
    refreshClientSecretUseCase = module.get(RefreshClientSecretUseCase);
    updatePasswordUseCase = module.get(UpdatePasswordUseCase);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findUserById', () => {
    it('should find a user by id', async () => {
      userDbPort.findById.mockResolvedValue(mockUser);
      const result = await resolver.findUserById(1);
      expect(result).toBe(mockUser);
      expect(userDbPort.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('findAllUsers', () => {
    it('should find all users', async () => {
      const paginatedResponse: PaginatedResponse<User> = {
        items: [mockUser],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
      userDbPort.findAll.mockResolvedValue(paginatedResponse);
      const result = await resolver.findAllUsers();
      expect(result).toBe(paginatedResponse);
      expect(userDbPort.findAll).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John',
        email: 'john@example.com',
        surname: 'Doe',
        credits: 100,
        role: UserRole.CUSTOMER,
        password: 'StrongPass123!',
      };
      createUserUseCase.execute.mockResolvedValue(mockUser);
      const result = await resolver.createUser(createUserDto);
      expect(result).toBe(mockUser);
      expect(createUserUseCase.execute).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'John Updated',
        email: 'john@example.com',
      };
      em.clear();
      const updatedUser = useUserFactory({ ...mockUser, name: 'John Updated', email: 'john@example.com' }, em);
      updateUserUseCase.execute.mockResolvedValue(updatedUser);
      const result = await resolver.updateUser(1, updateUserDto);
      expect(result.name).toBe('John Updated');
      expect(updateUserUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        data: updateUserDto,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      deleteUserUseCase.execute.mockResolvedValue(undefined);
      const result = await resolver.deleteUser(1);
      expect(result).toBe(true);
      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('refreshUserClientSecret', () => {
    it('should refresh user client secret', async () => {
      refreshClientSecretUseCase.execute.mockResolvedValue(mockUser);
      const result = await resolver.refreshUserClientSecret(1);
      expect(result).toBe(mockUser);
      expect(refreshClientSecretUseCase.execute).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('updateUserPassword', () => {
    it('should update user password', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      updatePasswordUseCase.execute.mockResolvedValue(true);
      const result = await resolver.updateUserPassword(1, updatePasswordDto);

      expect(result).toBe(true);
      expect(updatePasswordUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        data: updatePasswordDto,
      });
    });
  });
});
