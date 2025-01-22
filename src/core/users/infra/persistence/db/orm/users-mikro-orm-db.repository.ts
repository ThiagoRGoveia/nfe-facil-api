import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { UserDbPort } from '@/core/users/users.module';
import { User } from '@/core/users/domain/entities/user.entity';
import { CreateUserDto } from '@/core/users/application/dtos/create-user.dto';
import { UpdateUserDto } from '@/core/users/application/dtos/update-user.dto';

@Injectable()
export class UserMikroOrmDbRepository extends EntityRepository(User) implements UserDbPort {
  create(data: CreateUserDto): User {
    return this.em.create(User, data);
  }

  update(user: User, data: UpdateUserDto): User {
    user.assign(data);
    return user;
  }
}
