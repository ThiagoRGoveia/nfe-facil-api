import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from 'test/setup/base-unit-test.module';
import { useUserFactory } from '@/infra/tests/factories/user.factory';
import { UserCreditDbPort } from '../../ports/user-credits-db.port';
import { UpdateUserCreditUseCase } from '../update-user-credit.use-case';
import { useUserCreditFactory } from '@/infra/tests/factories/user-credit.factory';


describe('UpdateUserCreditUseCase', () => {
  let useCase: UpdateUserCreditUseCase;
  let userCreditDbPort: jest.Mocked<UserCreditDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UpdateUserCreditUseCase,
        {
          provide: UserCreditDbPort,
          useValue: createMock<UserCreditDbPort>(),
        },
      ],
    }).compile();

    useCase = module.get<UpdateUserCreditUseCase>(UpdateUserCreditUseCase);
    userCreditDbPort = module.get(UserCreditDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update userCredit successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const userCredit = useUserCreditFactory({ id: 1 }, em);
    const data = {
      name: 'Updated UserCredit',
    };

    userCreditDbPort.findById.mockResolvedValue(userCredit);
    userCreditDbPort.save.mockResolvedValue({ ...userCredit, ...data });

    // Act
    const result = await useCase.execute({
      user,
      id: userCredit.id,
      data,
    });

    // Assert
    expect(userCreditDbPort.findById).toHaveBeenCalledWith(userCredit.id);
    expect(userCreditDbPort.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining(data));
  });

  it('should throw error when userCredit not found', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const data = {
      name: 'Updated UserCredit',
    };

    userCreditDbPort.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({
        user,
        id: 'non-existent-id',
        data,
      }),
    ).rejects.toThrow('UserCredit not found');
  });

  it('should handle update errors', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const userCredit = useUserCreditFactory({ id: 1 }, em);
    const error = new Error('Database error');
    const data = {
      name: 'Updated UserCredit',
    };

    userCreditDbPort.findById.mockResolvedValue(userCredit);
    userCreditDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(
      useCase.execute({
        user,
        id: userCredit.id,
        data,
      }),
    ).rejects.toThrow(error);
  });
});

