import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { UserCreditDbPort } from '@/core/user-credits/user-credits.module';
import { UserCredit } from '@/core/user-credits/domain/entities/user-credit.entity';

@Injectable()
export class UserCreditMikroOrmDbRepository extends EntityRepository(UserCredit) implements UserCreditDbPort {
  constructor(private readonly em: EntityManager) {}
} 