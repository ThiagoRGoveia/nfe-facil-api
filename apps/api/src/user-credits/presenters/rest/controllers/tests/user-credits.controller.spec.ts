import { Test, TestingModule } from '@nestjs/testing';
import { UserCreditController } from '../user-credit.controller';
import { CreateUserCreditUseCase } from '../../../application/use-cases/create-user-credit.use-case';
import { UpdateUserCreditUseCase } from '../../../application/use-cases/update-user-credit.use-case';
import { DeleteUserCreditUseCase } from '../../../application/use-cases/delete-user-credit.use-case';
import { UserCreditDbPort } from '../../../application/ports/user-credits-db.port';
import { CreateUserCreditDto } from '../../../application/dtos/create-user-credit.dto';
import { UpdateUserCreditDto } from '../../../application/dtos/update-user-credit.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Filter } from '@/infra/dtos/filter.dto';
import { Sort } from '@/infra/dtos/sort.dto';

describe('UserCreditController', () => {
  let controller: UserCreditController;
  let createUserCreditUseCase: CreateUserCreditUseCase;
  let updateUserCreditUseCase: UpdateUserCreditUseCase;
  let deleteUserCreditUseCase: DeleteUserCreditUseCase;
  let userCreditDbPort: UserCreditDbPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserCreditController],
      providers: [
        {
          provide: CreateUserCreditUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateUserCreditUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteUserCreditUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UserCreditDbPort,
          useValue: { findById: jest.fn(), findAll: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UserCreditController>(UserCreditController);
    createUserCreditUseCase = module.get<CreateUserCreditUseCase>(CreateUserCreditUseCase);
    updateUserCreditUseCase = module.get<UpdateUserCreditUseCase>(UpdateUserCreditUseCase);
    deleteUserCreditUseCase = module.get<DeleteUserCreditUseCase>(DeleteUserCreditUseCase);
    userCreditDbPort = module.get<UserCreditDbPort>(UserCreditDbPort);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user-credit', async () => {
      const createDto = new CreateUserCreditDto();
      const expected = { id: 'test-id' };
      jest.spyOn(createUserCreditUseCase, 'execute').mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(result).toBe(expected);
      expect(createUserCreditUseCase.execute).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findOne', () => {
    it('should find a user-credit by id', async () => {
      const id = 'test-id';
      const expected = { id };
      jest.spyOn(userCreditDbPort, 'findById').mockResolvedValue(expected);

      const result = await controller.findOne(id);

      expect(result).toBe(expected);
      expect(userCreditDbPort.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('findAll', () => {
    it('should find all user-credits', async () => {
      const pagination = new Pagination();
      const filter = new Filter();
      const sort = new Sort();
      const expected = [{ id: 'test-id' }];
      jest.spyOn(userCreditDbPort, 'findAll').mockResolvedValue(expected);

      const result = await controller.findAll(pagination, filter, sort);

      expect(result).toBe(expected);
      expect(userCreditDbPort.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user-credit', async () => {
      const id = 'test-id';
      const updateDto = new UpdateUserCreditDto();
      const expected = { id };
      jest.spyOn(updateUserCreditUseCase, 'execute').mockResolvedValue(expected);

      const result = await controller.update(id, updateDto);

      expect(result).toBe(expected);
      expect(updateUserCreditUseCase.execute).toHaveBeenCalledWith({
        id,
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a user-credit', async () => {
      const id = 'test-id';
      jest.spyOn(deleteUserCreditUseCase, 'execute').mockResolvedValue(undefined);

      await controller.remove(id);

      expect(deleteUserCreditUseCase.execute).toHaveBeenCalledWith({ id });
    });
  });
}); 