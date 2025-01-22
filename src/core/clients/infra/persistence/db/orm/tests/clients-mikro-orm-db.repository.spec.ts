import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientMikroOrmDbRepository } from '../client-mikro-orm-db.repository';
import { useUnitTestModule } from 'test/setup/base-unit-test.module';
import { useClientFactory } from '@/infra/tests/factories/client.factory';
import { Client } from '@/core/clients/domain/entities/client.entity';
import { User } from '@/core/users/domain/entities/user.entity';

describe('ClientMikroOrmDbRepository (unit)', () => {
  let orm: MikroORM;
  let em: EntityManager;
  let repository: ClientMikroOrmDbRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [ClientMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<ClientMikroOrmDbRepository>(ClientMikroOrmDbRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
