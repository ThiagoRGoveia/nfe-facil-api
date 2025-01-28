import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { UserDbPort } from '../../ports/users-db.port';
import { CreateUserSocialUseCase } from '../create-user-social.use-case';
import { CreateUserSocialDto } from '../../dtos/create-user-social.dto';
import { UserRole } from '../../../domain/entities/user.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { SecretAdapter } from '@/infra/adapters/secret.adapter';

describe('CreateUserSocialUseCase', () => {
  let useCase: CreateUserSocialUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let logger: jest.Mocked<PinoLogger>;
  let uuidAdapter: jest.Mocked<UuidAdapter>;
  let secretAdapter: jest.Mocked<SecretAdapter>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CreateUserSocialUseCase,
        {
          provide: UserDbPort,
          useValue: createMock<UserDbPort>(),
        },
        {
          provide: PinoLogger,
          useValue: createMock<PinoLogger>(),
        },
        {
          provide: UuidAdapter,
          useValue: createMock<UuidAdapter>(),
        },
        {
          provide: SecretAdapter,
          useValue: createMock<SecretAdapter>(),
        },
      ],
    }).compile();

    useCase = module.get<CreateUserSocialUseCase>(CreateUserSocialUseCase);
    userDbPort = module.get(UserDbPort);
    logger = module.get(PinoLogger);
    uuidAdapter = module.get(UuidAdapter);
    secretAdapter = module.get(SecretAdapter);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create social user successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: 1, isSocial: true }, em);
    const createUserSocialDto: CreateUserSocialDto = {
      name: 'John',
      email: 'john.doe@example.com',
      auth0Id: 'auth0|123456789',
    };

    const generatedUuid = 'generated-uuid';
    const generatedSecret = 'GENERATED-SECRET';

    uuidAdapter.generate.mockReturnValue(generatedUuid);
    secretAdapter.generate.mockReturnValue(generatedSecret);
    userDbPort.create.mockReturnValue(user);

    // Act
    const result = await useCase.execute(createUserSocialDto);

    // Assert
    expect(userDbPort.create).toHaveBeenCalledWith({
      name: createUserSocialDto.name,
      email: createUserSocialDto.email,
      auth0Id: createUserSocialDto.auth0Id,
      clientId: generatedUuid,
      clientSecret: generatedSecret,
      role: UserRole.CUSTOMER,
      credits: 0,
      isSocial: true,
    });
    expect(userDbPort.save).toHaveBeenCalled();
    expect(result).toBe(user);
  });

  it('should create social user with minimal data', async () => {
    // Arrange
    const user = useUserFactory({ id: 1, isSocial: true }, em);
    const createUserSocialDto: CreateUserSocialDto = {
      auth0Id: 'auth0|123456789',
    };

    const generatedUuid = 'generated-uuid';
    const generatedSecret = 'GENERATED-SECRET';

    uuidAdapter.generate.mockReturnValue(generatedUuid);
    secretAdapter.generate.mockReturnValue(generatedSecret);
    userDbPort.create.mockReturnValue(user);

    // Act
    const result = await useCase.execute(createUserSocialDto);

    // Assert
    expect(userDbPort.create).toHaveBeenCalledWith({
      auth0Id: createUserSocialDto.auth0Id,
      clientId: generatedUuid,
      clientSecret: generatedSecret,
      role: UserRole.CUSTOMER,
      credits: 0,
      isSocial: true,
    });
    expect(userDbPort.save).toHaveBeenCalled();
    expect(result).toBe(user);
  });

  it('should handle database creation errors', async () => {
    // Arrange
    const error = new Error('Database error');
    const createUserSocialDto: CreateUserSocialDto = {
      name: 'John',
      email: 'john.doe@example.com',
      auth0Id: 'auth0|123456789',
    };

    userDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute(createUserSocialDto)).rejects.toThrow(
      new BadRequestException('Failed to create social user'),
    );
    expect(logger.error).toHaveBeenCalledWith('Failed to create social user:', error);
  });
});
