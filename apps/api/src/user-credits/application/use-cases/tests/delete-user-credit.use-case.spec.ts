import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from 'test/setup/base-unit-test.module';
import { useUserFactory } from '@/infra/tests/factories/user.factory';
import { UserCreditDbPort } from '../../ports/user-credits-db.port';
import { DeleteUserCreditUseCase } from '../Delete-user-credit.use-case';
import { useUserCreditFactory } from '@/infra/tests/factories/user-credit.factory';



describe('DeleteUserCreditUseCase', () => {
  let useCase: DeleteUserCreditUseCase;
  let userCreditDbPort: jest.Mocked<UserCreditDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        DeleteUserCreditUseCase,
        {
          provide: UserCreditDbPort,
          useValue: createMock<UserCreditDbPort>(),
        },
      ],
    }).compile();

    useCase = module.get<DeleteUserCreditUseCase>(DeleteUserCreditUseCase);
    userCreditDbPort = module.get(UserCreditDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should have userCreditDbPort injected', () => {
    expect(userCreditDbPort).toBeDefined();
  });
});
