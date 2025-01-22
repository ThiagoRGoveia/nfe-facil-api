import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientMikroOrmDbRepository } from '../client-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from 'test/setup/integration/base-integration-test.module';
import { useDbRefresh, useDbSchema } from 'test/setup/integration/db-schema.seed';
import { Client } from '@/core/clients/domain/entities/client.entity';
import { User } from '@/core/users/domain/entities/user.entity';
import { useDbUser } from '@/infra/tests/factories/user.factory';
import { useDbClient } from '@/infra/tests/factories/client.factory';

describe('ClientMikroOrmDbRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: ClientMikroOrmDbRepository;
  let testUser: User;
  let testClient: Client;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [ClientMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<ClientMikroOrmDbRepository>(ClientMikroOrmDbRepository);
    app = module.createNestApplication();

    await app.init();
    await useDbSchema(orm);

    testUser = await useDbUser({ id: 1 }, em);
    testClient = await useDbClient(
      {
        name: 'Test Client',
        createdBy: testUser,
      },
      em,
    );
  });

  afterEach(async () => {
    await useDbRefresh(orm);
    await app.close();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
