import { Global, Module } from '@nestjs/common';
import { UserDbPort } from './application/ports/users-db.port';
import { UserMikroOrmDbRepository } from './infra/persistence/db/orm/users-mikro-orm-db.repository';
import { UsersResolver } from './presenters/graphql/resolvers/users.resolver';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { RefreshClientSecretUseCase } from './application/use-cases/refresh-client-secret.use-case';
import { UpdatePasswordUseCase } from './application/use-cases/update-password.use-case';
import { CreateUserSocialUseCase } from './application/use-cases/create-user-social.use-case';

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
    RefreshClientSecretUseCase,
    UpdatePasswordUseCase,
    CreateUserSocialUseCase,
  ],
  exports: [
    UserDbPort,
    CreateUserUseCase,
    RefreshClientSecretUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
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
