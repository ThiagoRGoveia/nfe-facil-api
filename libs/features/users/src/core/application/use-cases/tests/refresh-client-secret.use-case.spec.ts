import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { UserDbPort } from '../../ports/users-db.port';
import { RefreshClientSecretUseCase } from '../refresh-client-secret.use-case';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { PinoLogger } from 'nestjs-pino';
import { NotFoundException } from '@nestjs/common';
import { SecretAdapter } from '@lib/secrets/core/secret.adapter';

describe('RefreshClientSecretUseCase', () => {
  let useCase: RefreshClientSecretUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let secretAdapter: jest.Mocked<SecretAdapter>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        RefreshClientSecretUseCase,
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

    useCase = module.get<RefreshClientSecretUseCase>(RefreshClientSecretUseCase);
    userDbPort = module.get(UserDbPort);
    secretAdapter = module.get(SecretAdapter);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should refresh client secret successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: '1' }, em);
    const oldSecret = user.clientSecret;
    const newSecret = 'NEW-GENERATED-SECRET';

    em.clear();
    const updatedUser = useUserFactory({ id: user.id, clientSecret: newSecret }, em);

    userDbPort.exists.mockResolvedValue(true);
    secretAdapter.generate.mockReturnValue(newSecret);
    userDbPort.update.mockReturnValue(updatedUser);

    // Act
    const result = await useCase.execute({ id: user.id });

    // Assert
    expect(result.clientSecret).toBe(newSecret);
    expect(result.clientSecret).not.toBe(oldSecret);
    expect(userDbPort.save).toHaveBeenCalled();
    expect(secretAdapter.generate).toHaveBeenCalled();
  });

  it('should throw NotFoundException when user not found', async () => {
    // Arrange
    userDbPort.exists.mockResolvedValue(false);

    // Act & Assert
    await expect(useCase.execute({ id: '1' })).rejects.toThrow(new NotFoundException('User not found'));
  });

  it('should handle errors properly', async () => {
    // Arrange
    const user = useUserFactory({ id: '1' }, em);
    const error = new Error('Database error');

    userDbPort.findById.mockResolvedValue(user);
    userDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute({ id: user.id })).rejects.toThrow(error);
  });
});
