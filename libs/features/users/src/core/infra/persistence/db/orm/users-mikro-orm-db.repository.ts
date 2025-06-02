import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@lib/database/infra/persistence/repositories/_base-mikro-orm-db.repository';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { RequiredEntityData } from '@mikro-orm/core';
import { UserDbPort } from '@lib/users/users.module';
import { DtoWithClientCredentials } from '@lib/users/core/application/ports/users-db.port';

@Injectable()
export class UserMikroOrmDbRepository extends EntityRepository(User) implements UserDbPort {
  create(data: DtoWithClientCredentials<RequiredEntityData<User>>): User {
    return this.em.create(User, data);
  }

  update(id: User['id'], data: Partial<DtoWithClientCredentials<RequiredEntityData<User>>>): User {
    const user = this.em.getReference(User, id);
    user.assign(data);
    return user;
  }

  findByClientId(clientId: string): Promise<User | null> {
    return this.em.findOne(User, { clientId });
  }

  findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.em.findOne(User, { auth0Id });
  }
}
