import { Global, Module } from '@nestjs/common';
import { UserDbPort } from './application/ports/users-db.port';
import { UserMikroOrmDbRepository } from './infra/persistence/db/orm/users-mikro-orm-db.repository';
import { UsersResolver } from './presenters/graphql/resolvers/users.resolver';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';

@Global()
@Module({
  providers: [
    UsersResolver,
    {
      provide: UserDbPort,
      useClass: UserMikroOrmDbRepository,
    },
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: [UserDbPort, CreateUserUseCase],
})
export class UsersModule {}

export { UserDbPort, CreateUserUseCase, UpdateUserUseCase, DeleteUserUseCase, UsersResolver };
