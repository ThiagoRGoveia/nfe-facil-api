import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from '../client.controller';
import { CreateClientUseCase } from '../../../application/use-cases/create-client.use-case';
import { UpdateClientUseCase } from '../../../application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from '../../../application/use-cases/delete-client.use-case';
import { ClientDbPort } from '../../../application/ports/client-db.port';
import { CreateClientDto } from '../../../application/dtos/create-client.dto';
import { UpdateClientDto } from '../../../application/dtos/update-client.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Filter } from '@/infra/dtos/filter.dto';
import { Sort } from '@/infra/dtos/sort.dto';

describe('ClientController', () => {
  let controller: ClientController;
  let createClientUseCase: CreateClientUseCase;
  let updateClientUseCase: UpdateClientUseCase;
  let deleteClientUseCase: DeleteClientUseCase;
  let clientDbPort: ClientDbPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: CreateClientUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateClientUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteClientUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ClientDbPort,
          useValue: { findById: jest.fn(), findAll: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    createClientUseCase = module.get<CreateClientUseCase>(CreateClientUseCase);
    updateClientUseCase = module.get<UpdateClientUseCase>(UpdateClientUseCase);
    deleteClientUseCase = module.get<DeleteClientUseCase>(DeleteClientUseCase);
    clientDbPort = module.get<ClientDbPort>(ClientDbPort);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a client', async () => {
      const createDto = new CreateClientDto();
      const expected = { id: 'test-id' };
      jest.spyOn(createClientUseCase, 'execute').mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(result).toBe(expected);
      expect(createClientUseCase.execute).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findOne', () => {
    it('should find a client by id', async () => {
      const id = 'test-id';
      const expected = { id };
      jest.spyOn(clientDbPort, 'findById').mockResolvedValue(expected);

      const result = await controller.findOne(id);

      expect(result).toBe(expected);
      expect(clientDbPort.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('findAll', () => {
    it('should find all clients', async () => {
      const pagination = new Pagination();
      const filter = new Filter();
      const sort = new Sort();
      const expected = [{ id: 'test-id' }];
      jest.spyOn(clientDbPort, 'findAll').mockResolvedValue(expected);

      const result = await controller.findAll(pagination, filter, sort);

      expect(result).toBe(expected);
      expect(clientDbPort.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const id = 'test-id';
      const updateDto = new UpdateClientDto();
      const expected = { id };
      jest.spyOn(updateClientUseCase, 'execute').mockResolvedValue(expected);

      const result = await controller.update(id, updateDto);

      expect(result).toBe(expected);
      expect(updateClientUseCase.execute).toHaveBeenCalledWith({
        id,
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      const id = 'test-id';
      jest.spyOn(deleteClientUseCase, 'execute').mockResolvedValue(undefined);

      await controller.remove(id);

      expect(deleteClientUseCase.execute).toHaveBeenCalledWith({ id });
    });
  });
});
