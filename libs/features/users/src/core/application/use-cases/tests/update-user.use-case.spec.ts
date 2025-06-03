import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { UserDbPort } from '../../ports/users-db.port';
import { UpdateUserUseCase } from '../update-user.use-case';
import { UpdateUserDto } from '../../dtos/update-user.dto';
import { PinoLogger } from 'nestjs-pino';
import { InternalServerErrorException } from '@nestjs/common';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let userDbPort: jest.Mocked<UserDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UpdateUserUseCase,
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

    useCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    userDbPort = module.get(UserDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update user successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: '1' }, em);
    const updateUserDto: UpdateUserDto = {
      name: 'Updated John',
      surname: 'Updated Doe',
    };
    em.clear(); // Clear identity map to allow new entity creation to mock updated user
    const updatedUser = useUserFactory({ ...user, ...updateUserDto }, em);
    userDbPort.findById.mockResolvedValue(user);
    userDbPort.update.mockReturnValue(updatedUser);

    // Act
    const result = await useCase.execute({ id: user.id, data: updateUserDto });

    // Assert
    expect(userDbPort.update).toHaveBeenCalledWith(user.id, updateUserDto);
    expect(userDbPort.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining(updateUserDto));
  });

  it('should handle update errors', async () => {
    // Arrange
    const error = new Error('Database error');
    const updateUserDto: UpdateUserDto = {
      name: 'Updated John',
    };

    userDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(useCase.execute({ id: '1', data: updateUserDto })).rejects.toThrow(
      new InternalServerErrorException('Failed to update user in database'),
    );
  });
});
