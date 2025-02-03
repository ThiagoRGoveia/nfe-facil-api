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
import { AuthPort, AuthUserDto } from '@/infra/auth/ports/auth.port';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let uuidAdapter: jest.Mocked<UuidAdapter>;
  let secretAdapter: jest.Mocked<SecretAdapter>;
  let authPort: jest.Mocked<AuthPort>;
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
    uuidAdapter = module.get(UuidAdapter);
    secretAdapter = module.get(SecretAdapter);
    authPort = module.get(AuthPort);
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
      password: 'StrongPass123!',
    };

    const generatedUuid = 'generated-uuid';
    const generatedSecret = 'GENERATED-SECRET';
    const auth0UserId = 'auth0|123456789';

    uuidAdapter.generate.mockReturnValue(generatedUuid);
    secretAdapter.generate.mockReturnValue(generatedSecret);
    authPort.createUser.mockResolvedValue({
      userId: auth0UserId,
      email: createUserDto.email,
      emailVerified: false,
    } as AuthUserDto);
    userDbPort.create.mockReturnValue(user);

    // Act
    const result = await useCase.execute(createUserDto);

    // Assert
    expect(authPort.createUser).toHaveBeenCalledWith(createUserDto.email, createUserDto.password);
    expect(userDbPort.create).toHaveBeenCalledWith({
      name: createUserDto.name,
      surname: createUserDto.surname,
      email: createUserDto.email,
      credits: createUserDto.credits,
      role: createUserDto.role,
      clientId: generatedUuid,
      clientSecret: generatedSecret,
      auth0Id: auth0UserId,
    });
    expect(userDbPort.save).toHaveBeenCalled();
    expect(result).toBe(user);
  });

  it('should handle Auth0 user creation failure', async () => {
    // Arrange
    const createUserDto: CreateUserDto = {
      name: 'John',
      surname: 'Doe',
      credits: 100,
      role: UserRole.CUSTOMER,
      email: 'john.doe@example.com',
      password: 'StrongPass123!',
    };

    authPort.createUser.mockResolvedValue({
      userId: '',
      email: createUserDto.email,
      emailVerified: false,
    } as AuthUserDto);

    // Act & Assert
    await expect(useCase.execute(createUserDto)).rejects.toThrow(new BadRequestException('Failed to create user'));
  });

  it('should handle database creation errors', async () => {
    // Arrange
    const error = new Error('Database error');
    const createUserDto: CreateUserDto = {
      name: 'John',
      surname: 'Doe',
      credits: 100,
      role: UserRole.CUSTOMER,
      email: 'john.doe@example.com',
      password: 'StrongPass123!',
    };

    const auth0UserId = 'auth0|123456789';
    authPort.createUser.mockResolvedValue({
      userId: auth0UserId,
      email: createUserDto.email,
      emailVerified: false,
    } as AuthUserDto);
    userDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute(createUserDto)).rejects.toThrow(new BadRequestException('Failed to create user'));
  });
});
