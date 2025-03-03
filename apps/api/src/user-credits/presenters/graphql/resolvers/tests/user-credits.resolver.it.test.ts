import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { UserCreditsModule } from '@/core/user-credits/user-credits.module';
import { UsersModule } from '@/core/users/users.module';
import { useGraphqlModule } from '@/infra/tests/graphql-integration-test.module';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { User } from '@/core/users/domain/entities/user.entity';
import { UserCreditsResolver } from '../user-credits.resolver';
import { UserCreditDbPort } from '../../../application/ports/user-credits-db.port';

describe('UserCreditsResolver (Integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let user: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useGraphqlModule(() => user), UsersModule, UserCreditsModule],
      providers: [UserCreditsResolver],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    
    await app.init();
    user = await useDbUser({}, em);
  });

  afterEach(async () => {
    
    await app.close();
  });
}); 