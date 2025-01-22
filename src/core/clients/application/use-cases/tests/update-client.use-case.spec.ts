import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from 'test/setup/base-unit-test.module';
import { useUserFactory } from '@/infra/tests/factories/user.factory';
import { ClientDbPort } from '../../ports/client-db.port';
import { UpdateClientUseCase } from '../update-client.use-case';
import { useClientFactory } from '@/infra/tests/factories/client.factory';

describe('UpdateClientUseCase', () => {
  let useCase: UpdateClientUseCase;
  let clientDbPort: jest.Mocked<ClientDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UpdateClientUseCase,
        {
          provide: ClientDbPort,
          useValue: createMock<ClientDbPort>(),
        },
      ],
    }).compile();

    useCase = module.get<UpdateClientUseCase>(UpdateClientUseCase);
    clientDbPort = module.get(ClientDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update client successfully', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const client = useClientFactory({ id: 1 }, em);
    const data = {
      name: 'Updated Client',
    };

    clientDbPort.findById.mockResolvedValue(client);
    clientDbPort.save.mockResolvedValue({ ...client, ...data });

    // Act
    const result = await useCase.execute({
      user,
      id: client.id,
      data,
    });

    // Assert
    expect(clientDbPort.findById).toHaveBeenCalledWith(client.id);
    expect(clientDbPort.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining(data));
  });

  it('should throw error when client not found', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const data = {
      name: 'Updated Client',
    };

    clientDbPort.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({
        user,
        id: 'non-existent-id',
        data,
      }),
    ).rejects.toThrow('Client not found');
  });

  it('should handle update errors', async () => {
    // Arrange
    const user = useUserFactory({ id: 1 }, em);
    const client = useClientFactory({ id: 1 }, em);
    const error = new Error('Database error');
    const data = {
      name: 'Updated Client',
    };

    clientDbPort.findById.mockResolvedValue(client);
    clientDbPort.save.mockRejectedValue(error);

    // Act & Assert
    await expect(
      useCase.execute({
        user,
        id: client.id,
        data,
      }),
    ).rejects.toThrow(error);
  });
});
