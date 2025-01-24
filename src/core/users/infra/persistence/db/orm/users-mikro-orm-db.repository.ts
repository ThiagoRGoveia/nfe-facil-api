import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { UserDbPort, DtoWithClientCredentials } from '@/core/users/application/ports/users-db.port';
import { User } from '@/core/users/domain/entities/user.entity';
import { CreateUserDto } from '@/core/users/application/dtos/create-user.dto';
import { UpdateUserDto } from '@/core/users/application/dtos/update-user.dto';

@Injectable()
export class UserMikroOrmDbRepository extends EntityRepository(User) implements UserDbPort {
  create(data: DtoWithClientCredentials<CreateUserDto>): User {
    return this.em.create(User, data);
  }

  update(id: number, data: Partial<DtoWithClientCredentials<UpdateUserDto>>): User {
    const user = this.em.getReference(User, id);
    user.assign(data);
    return user;
  }

  findByClientId(clientId: string): Promise<User | null> {
    return this.em.findOne(User, { clientId });
  }
}
