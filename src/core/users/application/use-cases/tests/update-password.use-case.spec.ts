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
import { AuthPort, AuthUserDto } from '@/infra/auth/ports/auth.port';

describe('UpdatePasswordUseCase', () => {
  let useCase: UpdatePasswordUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let authPort: jest.Mocked<AuthPort>;
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
      ],
    }).compile();

    useCase = module.get<UpdatePasswordUseCase>(UpdatePasswordUseCase);
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

  it('should update password successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: '1', auth0Id: 'auth0|123' }, em);
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    userDbPort.findById.mockResolvedValue(user);
    authPort.updatePassword.mockResolvedValue(
      createMock<AuthUserDto>({
        userId: user.auth0Id,
        email: user.email,
        emailVerified: false,
      }),
    );

    // Act
    const result = await useCase.execute({ id: '1', data: updatePasswordDto });

    // Assert
    expect(result).toBe(true);
    expect(userDbPort.findById).toHaveBeenCalledWith('1');
    expect(authPort.updatePassword).toHaveBeenCalledWith(user.auth0Id, updatePasswordDto.newPassword);
  });

  it('should throw BadRequestException when user is not found', async () => {
    // Arrange
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    userDbPort.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ id: '1', data: updatePasswordDto })).rejects.toThrow(
      new BadRequestException('User not found'),
    );
    expect(authPort.updatePassword).not.toHaveBeenCalled();
  });

  it('should handle Auth0 update failure', async () => {
    // Arrange
    const user = useUserFactory({ id: '1', auth0Id: 'auth0|123' }, em);
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };
    const error = new Error('Auth0 error');

    userDbPort.findById.mockResolvedValue(user);
    authPort.updatePassword.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute({ id: '1', data: updatePasswordDto })).rejects.toThrow(
      new BadRequestException('Failed to update password'),
    );
  });
});
