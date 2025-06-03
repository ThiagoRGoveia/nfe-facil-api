import { Global, Module } from '@nestjs/common';
import { UserDbPort } from './core/application/ports/users-db.port';
import { UserMikroOrmDbRepositoryProvider } from './core/infra/persistence/db/orm/users-mikro-orm-db.repository';
import { UsersResolver } from './core/presenters/graphql/resolvers/users.resolver';
import { CreateUserUseCase } from './core/application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './core/application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './core/application/use-cases/delete-user.use-case';
import { RefreshClientSecretUseCase } from './core/application/use-cases/refresh-client-secret.use-case';
import { UpdatePasswordUseCase } from './core/application/use-cases/update-password.use-case';
import { CreateUserSocialUseCase } from '../../../tooling/auth/src/core/use-cases/create-user-social.use-case';

@Global()
@Module({
  providers: [
    UserMikroOrmDbRepositoryProvider,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    RefreshClientSecretUseCase,
    UpdatePasswordUseCase,
    CreateUserSocialUseCase,
  ],
  exports: [
    UserDbPort,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    RefreshClientSecretUseCase,
    UpdatePasswordUseCase,
    CreateUserSocialUseCase,
  ],
})
export class UsersModule {}

export {
  UserDbPort,
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  UpdatePasswordUseCase,
  UsersResolver,
  CreateUserSocialUseCase,
};
