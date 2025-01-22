import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from '../users.resolver';
import { UserDbPort } from '../../../../application/ports/users-db.port';
import { CreateUserUseCase } from '../../../../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../../../application/use-cases/delete-user.use-case';
import { User, UserRole } from '../../../../domain/entities/user.entity';
import { CreateUserDto } from '../../../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../../../application/dtos/update-user.dto';
import { useUserFactory } from '../../../../infra/tests/factories/users.factory';
import { EntityManager } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { createMock } from '@golevelup/ts-jest';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let userDbPort: jest.Mocked<UserDbPort>;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let updateUserUseCase: jest.Mocked<UpdateUserUseCase>;
  let deleteUserUseCase: jest.Mocked<DeleteUserUseCase>;
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
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    userDbPort = module.get(UserDbPort);
    createUserUseCase = module.get(CreateUserUseCase);
    updateUserUseCase = module.get(UpdateUserUseCase);
    deleteUserUseCase = module.get(DeleteUserUseCase);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      userDbPort.findById.mockResolvedValue(mockUser);
      const result = await resolver.findUserById(1);
      expect(result).toEqual(mockUser);
      expect(userDbPort.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when user is not found', async () => {
      userDbPort.findById.mockResolvedValue(null);
      const result = await resolver.findUserById(1);
      expect(result).toBeNull();
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      const mockPaginatedResponse: PaginatedResponse<User> = {
        items: [mockUser],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
      userDbPort.findAll.mockResolvedValue(mockPaginatedResponse);
      const result = await resolver.findAllUsers();
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John',
        surname: 'Doe',
        clientId: 1,
        role: UserRole.CUSTOMER,
        credits: 100,
      };
      createUserUseCase.execute.mockResolvedValue(mockUser);
      const result = await resolver.createUser(createUserDto);
      expect(result).toEqual(mockUser);
      expect(createUserUseCase.execute).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'John Updated',
      };
      em.clear();
      const updatedUser = useUserFactory({ ...mockUser, name: 'John Updated' }, em);
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
});
