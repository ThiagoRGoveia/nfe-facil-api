import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from 'test/setup/base-unit-test.module';
import { useUserFactory } from '@/infra/tests/factories/user.factory';
import { ClientDbPort } from '../../ports/client-db.port';
import { CreateClientUseCase } from '../create-client.use-case';
import { useClientFactory } from '@/infra/tests/factories/client.factory';

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let clientDbPort: jest.Mocked<ClientDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CreateClientUseCase,
        {
          provide: ClientDbPort,
          useValue: createMock<ClientDbPort>(),
        },
      ],
    }).compile();

    useCase = module.get<CreateClientUseCase>(CreateClientUseCase);
    clientDbPort = module.get(ClientDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create client successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const client = useClientFactory({ id: 1 }, em);
    const data = {
      name: 'Test Client',
    };

    clientDbPort.save.mockResolvedValue(client);

    // Act
    const result = await useCase.execute({
      user,
      data,
    });

    // Assert
    expect(clientDbPort.save).toHaveBeenCalled();
    expect(result).toBe(client);
  });

  it('should handle creation errors', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const error = new Error('Database error');
    const data = {
      name: 'Test Client',
    };

    clientDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(
      useCase.execute({
        user,
        data,
      }),
    ).rejects.toThrow(error);
  });
});
