import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { UserCreditMikroOrmDbRepository } from '../user-credits-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';

import { UserCredit } from '@/core/user-credits/domain/entities/user-credit.entity';
import { useDbUserCredit } from '@/infra/tests/factories/user-credit.factory';


describe('UserCreditMikroOrmDbRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: UserCreditMikroOrmDbRepository;
  let testUserCredit: UserCredit;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [UserCreditMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<UserCreditMikroOrmDbRepository>(UserCreditMikroOrmDbRepository);
    app = module.createNestApplication();

    await app.init();
    

    testUserCredit = await useDbUserCredit(
      {
        name: 'Test UserCredit',
        createdBy: testUser,
      },
      em,
    );
  });

  afterEach(async () => {
    
    await app.close();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
}); 