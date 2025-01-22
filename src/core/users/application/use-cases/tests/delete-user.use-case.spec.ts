import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { UserDbPort } from '../../ports/users-db.port';
import { DeleteUserUseCase } from '../delete-user.use-case';
import { PinoLogger } from 'nestjs-pino';
import { InternalServerErrorException } from '@nestjs/common';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let logger: jest.Mocked<PinoLogger>;
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
    logger = module.get(PinoLogger);
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
    const user = useUserFactory({ id: 1 }, em);
    userDbPort.delete.mockResolvedValue();

    // Act
    await useCase.execute({ id: user.id });

    // Assert
    expect(userDbPort.delete).toHaveBeenCalledWith(user.id);
    expect(userDbPort.save).toHaveBeenCalled();
  });

  it('should handle deletion errors', async () => {
    // Arrange
    const error = new Error('Database error');
    userDbPort.delete.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute({ id: 1 })).rejects.toThrow(
      new InternalServerErrorException('Failed to delete user from database'),
    );
    expect(logger.error).toHaveBeenCalledWith({ err: error, userId: 1 }, 'Failed to delete user');
  });
});
