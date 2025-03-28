import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
import { UserDbPort } from './application/ports/users-db.port';
import { UserMikroOrmDbRepository } from './infra/persistence/db/orm/users-mikro-orm-db.repository';
import { UsersResolver } from './presenters/graphql/resolvers/users.resolver';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { RefreshClientSecretUseCase } from './application/use-cases/refresh-client-secret.use-case';
import { UpdatePasswordUseCase } from './application/use-cases/update-password.use-case';
import { CreateUserSocialUseCase } from './application/use-cases/create-user-social.use-case';

const controllers = [];
const resolvers = [UsersResolver];
const defaultProviders = [
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
];
const exportValues = [
  UserDbPort,
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  RefreshClientSecretUseCase,
  UpdatePasswordUseCase,
  CreateUserSocialUseCase,
];

@Global()
@Module({})
export class UsersModule {
  static register(@Optional() @Inject('API_TYPE') apiType: 'rest' | 'graphql' | 'all' | 'none' = 'all'): DynamicModule {
    const providers = [...(apiType === 'graphql' || apiType === 'all' ? resolvers : []), ...defaultProviders];
    return {
      module: UsersModule,
      controllers: apiType === 'rest' || apiType === 'all' ? controllers : [],
      providers,
      exports: exportValues,
    };
  }
}

export {
  UserDbPort,
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  UpdatePasswordUseCase,
  UsersResolver,
  CreateUserSocialUseCase,
};
