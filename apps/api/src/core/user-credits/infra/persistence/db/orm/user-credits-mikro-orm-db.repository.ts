import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { UserCreditsDbPort } from '@/core/user-credits/application/ports/user-credits-db.port';
import { UserCredit } from '@/core/user-credits/domain/entities/user-credit.entity';
import { User } from '@/core/users/domain/entities/user.entity';

@Injectable()
export class UserCreditsMikroOrmDbRepository extends EntityRepository(UserCredit) implements UserCreditsDbPort {
  findByUserId(userId: User['id']): Promise<UserCredit | null> {
    return this.em.findOne(UserCredit, { user: { id: userId } });
  }
}
