import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from 'test/setup/base-unit-test.module';
import { useUserFactory } from '@/infra/tests/factories/user.factory';
import { ClientDbPort } from '../../ports/client-db.port';
import { deleteClientUseCase } from '../delete-client.use-case';
import { useClientFactory } from '@/infra/tests/factories/client.factory';

describe('deleteClientUseCase', () => {
  let useCase: deleteClientUseCase;
  let clientDbPort: jest.Mocked<ClientDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        deleteClientUseCase,
        {
          provide: ClientDbPort,
          useValue: createMock<ClientDbPort>(),
        },
      ],
    }).compile();

    useCase = module.get<deleteClientUseCase>(deleteClientUseCase);
    clientDbPort = module.get(ClientDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should have clientDbPort injected', () => {
    expect(clientDbPort).toBeDefined();
  });
});
