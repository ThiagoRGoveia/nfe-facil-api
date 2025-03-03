import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from 'test/setup/base-unit-test.module';
import { useUserFactory } from '@/infra/tests/factories/user.factory';
import { UserCreditDbPort } from '../../ports/user-credits-db.port';
import { CreateUserCreditUseCase } from '../create-user-credit.use-case';
import { useUserCreditFactory } from '@/infra/tests/factories/user-credit.factory';

describe('CreateUserCreditUseCase', () => {
  let useCase: CreateUserCreditUseCase;
  let userCreditDbPort: jest.Mocked<UserCreditDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CreateUserCreditUseCase,
        {
          provide: UserCreditDbPort,
          useValue: createMock<UserCreditDbPort>(),
        },
      ],
    }).compile();

    useCase = module.get<CreateUserCreditUseCase>(CreateUserCreditUseCase);
    userCreditDbPort = module.get(UserCreditDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create userCredit successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const userCredit = useUserCreditFactory({ id: 1 }, em);
    const data = {
      name: 'Test UserCredit',
    };

    userCreditDbPort.save.mockResolvedValue(userCredit);

    // Act
    const result = await useCase.execute({
      user,
      data,
    });

    // Assert
    expect(userCreditDbPort.save).toHaveBeenCalled();
    expect(result).toBe(userCredit);
  });

  it('should handle creation errors', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const error = new Error('Database error');
    const data = {
      name: 'Test UserCredit',
    };

    userCreditDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(
      useCase.execute({
        user,
        data,
      }),
    ).rejects.toThrow(error);
  });
});


