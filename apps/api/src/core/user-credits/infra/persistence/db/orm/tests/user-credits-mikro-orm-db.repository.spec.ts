// import { MikroORM } from '@mikro-orm/core';
// import { EntityManager } from '@mikro-orm/postgresql';
// import { Test, TestingModule } from '@nestjs/testing';
// import { UserCreditMikroOrmDbRepository } from '../user-credit-mikro-orm-db.repository';
// import { useUnitTestModule } from 'test/setup/base-unit-test.module';
// import { useUserCreditFactory } from '@/infra/tests/factories/user-credit.factory';
// import { UserCredit } from '@/core/user-credits/domain/entities/user-credit.entity';
// import { User } from '@/core/users/domain/entities/user.entity';

// describe('UserCreditMikroOrmDbRepository (unit)', () => {
//   let orm: MikroORM;
//   let em: EntityManager;
//   let repository: UserCreditMikroOrmDbRepository;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [useUnitTestModule()],
//       providers: [UserCreditMikroOrmDbRepository],
//     }).compile();

//     orm = module.get<MikroORM>(MikroORM);
//     em = orm.em as EntityManager;
//     repository = module.get<UserCreditMikroOrmDbRepository>(UserCreditMikroOrmDbRepository);
//   });

//   afterEach(() => {
//     jest.resetAllMocks();
//   });

//   it('should be defined', () => {
//     expect(repository).toBeDefined();
//   });
// });
