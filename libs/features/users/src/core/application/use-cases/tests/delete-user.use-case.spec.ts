import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { UserDbPort } from '../../ports/users-db.port';
import { DeleteUserUseCase } from '../delete-user.use-case';
import { PinoLogger } from 'nestjs-pino';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AuthPort } from '@lib/auth/core/ports/auth.port';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let authPort: jest.Mocked<AuthPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        DeleteUserUseCase,
        {
          provide: UserDbPort,
          useValue: createMock<UserDbPort>(),
        },
        {
          provide: PinoLogger,
          useValue: createMock<PinoLogger>(),
        },
      ],
    }).compile();

    useCase = module.get<DeleteUserUseCase>(DeleteUserUseCase);
    userDbPort = module.get(UserDbPort);
    authPort = module.get(AuthPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete user successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: '1', auth0Id: 'auth0|123' }, em);
    userDbPort.findById.mockResolvedValue(user);
    userDbPort.delete.mockResolvedValue();

    // Act
    await useCase.execute({ id: user.id });

    // Assert
    expect(userDbPort.findById).toHaveBeenCalledWith(user.id);
    expect(userDbPort.delete).toHaveBeenCalledWith(user.id);
    expect(authPort.deleteUser).toHaveBeenCalledWith(user.auth0Id);
    expect(userDbPort.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException when user doesnt exist', async () => {
    // Arrange
    userDbPort.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ id: '999' })).rejects.toThrow(new NotFoundException('User not found'));
  });

  it('should handle auth0 deletion errors', async () => {
    // Arrange
    const user = useUserFactory({ id: '1', auth0Id: 'auth0|123' }, em);
    const authError = new Error('Auth0 error');
    userDbPort.findById.mockResolvedValue(user);
    authPort.deleteUser.mockRejectedValue(authError);

    // Act & Assert
    await expect(useCase.execute({ id: user.id })).rejects.toThrow(
      new InternalServerErrorException('Failed to delete user from database'),
    );
  });
});
