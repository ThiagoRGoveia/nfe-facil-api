import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { UserDbPort } from '../../ports/users-db.port';
import { UpdatePasswordUseCase } from '../update-password.use-case';
import { UpdatePasswordDto } from '../../dtos/update-password.dto';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import { Auth0Client } from '@/infra/auth/auth0.client';
import { ApiResponse } from 'auth0';
import { GetUsers200ResponseOneOfInner } from 'auth0';

describe('UpdatePasswordUseCase', () => {
  let useCase: UpdatePasswordUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let logger: jest.Mocked<PinoLogger>;
  let auth0Client: jest.Mocked<Auth0Client>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UpdatePasswordUseCase,
        {
          provide: UserDbPort,
          useValue: createMock<UserDbPort>(),
        },
        {
          provide: PinoLogger,
          useValue: createMock<PinoLogger>(),
        },
        {
          provide: Auth0Client,
          useValue: createMock<Auth0Client>(),
        },
      ],
    }).compile();

    useCase = module.get<UpdatePasswordUseCase>(UpdatePasswordUseCase);
    userDbPort = module.get(UserDbPort);
    logger = module.get(PinoLogger);
    auth0Client = module.get(Auth0Client);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update password successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: 1, auth0Id: 'auth0|123' }, em);
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    userDbPort.findById.mockResolvedValue(user);
    auth0Client.updatePassword.mockResolvedValue(
      createMock<ApiResponse<GetUsers200ResponseOneOfInner>>({
        data: {
          user_id: user.auth0Id,
          email: user.email,
          email_verified: false,
        },
      }),
    );

    // Act
    const result = await useCase.execute({ id: 1, data: updatePasswordDto });

    // Assert
    expect(result).toBe(true);
    expect(userDbPort.findById).toHaveBeenCalledWith(1);
    expect(auth0Client.updatePassword).toHaveBeenCalledWith(user.auth0Id, updatePasswordDto.newPassword);
  });

  it('should throw BadRequestException when user is not found', async () => {
    // Arrange
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    userDbPort.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ id: 1, data: updatePasswordDto })).rejects.toThrow(
      new BadRequestException('User not found'),
    );
    expect(auth0Client.updatePassword).not.toHaveBeenCalled();
  });

  it('should handle Auth0 update failure', async () => {
    // Arrange
    const user = useUserFactory({ id: 1, auth0Id: 'auth0|123' }, em);
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };
    const error = new Error('Auth0 error');

    userDbPort.findById.mockResolvedValue(user);
    auth0Client.updatePassword.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute({ id: 1, data: updatePasswordDto })).rejects.toThrow(
      new BadRequestException('Failed to update password'),
    );
    expect(logger.error).toHaveBeenCalledWith('Failed to update user password:', error);
  });
});
