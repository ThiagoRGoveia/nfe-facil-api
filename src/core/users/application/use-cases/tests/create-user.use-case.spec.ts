import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { UserDbPort } from '../../ports/users-db.port';
import { CreateUserUseCase } from '../create-user.use-case';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { UserRole } from '../../../domain/entities/user.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { SecretAdapter } from '@/infra/adapters/secret.adapter';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let logger: jest.Mocked<PinoLogger>;
  let uuidAdapter: jest.Mocked<UuidAdapter>;
  let secretAdapter: jest.Mocked<SecretAdapter>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CreateUserUseCase,
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

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
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

  it('should create user successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const createUserDto: CreateUserDto = {
      name: 'John',
      surname: 'Doe',
      credits: 100,
      role: UserRole.CUSTOMER,
      email: 'john.doe@example.com',
    };

    const generatedUuid = 'generated-uuid';
    const generatedSecret = 'GENERATED-SECRET';

    uuidAdapter.generate.mockReturnValue(generatedUuid);
    secretAdapter.generate.mockReturnValue(generatedSecret);
    userDbPort.create.mockReturnValue(user);

    // Act
    const result = await useCase.execute(createUserDto);

    // Assert
    expect(userDbPort.create).toHaveBeenCalledWith({
      ...createUserDto,
      clientId: generatedUuid,
      clientSecret: generatedSecret,
    });
    expect(userDbPort.save).toHaveBeenCalled();
    expect(result).toBe(user);
  });

  it('should handle creation errors', async () => {
    // Arrange
    const error = new Error('Database error');
    const createUserDto: CreateUserDto = {
      name: 'John',
      surname: 'Doe',
      credits: 100,
      role: UserRole.CUSTOMER,
      email: 'john.doe@example.com',
    };

    userDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute(createUserDto)).rejects.toThrow(
      new BadRequestException('Failed to create user in database'),
    );
    expect(logger.error).toHaveBeenCalledWith('Failed to create user:', error);
  });
});
