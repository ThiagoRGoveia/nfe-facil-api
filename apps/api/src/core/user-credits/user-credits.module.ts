// import { Global, Module } from '@nestjs/common';
// import { UserCreditDbPort } from './application/ports/user-credits-db.port';
// import { UserCreditMikroOrmDbRepository } from './infra/persistence/db/orm/user-credits-mikro-orm-db.repository';
// import { Resolver } from './presenters/graphql/resolvers/user-credits.resolver';
// import { CreateUserCreditUseCase } from './application/use-cases/create-user-credit.use-case';
// import { UpdateUserCreditUseCase } from './application/use-cases/update-user-credit.use-case';
// import { DeleteUserCreditUseCase } from './application/use-cases/delete-user-credit.use-case';

// @Global()
// @Module({
//   providers: [
//     UserCreditResolver,
//     {
//       provide: UserCreditDbPort,
//       useClass: UserCreditMikroOrmDbRepository,
//     },
//     CreateUserCreditUseCase,
//     UpdateUserCreditUseCase,
//     DeleteUserCreditUseCase,
//   ],
//   exports: [
//     UserCreditDbPort,
//     CreateUserCreditUseCase,
//   ],
// })
// export class UserCreditsModule {}

// export {
//   UserCreditDbPort,
//   CreateUserCreditUseCase,
//   UpdateUserCreditUseCase,
//   DeleteUserCreditUseCase,
//   UserCreditResolver,
// };
