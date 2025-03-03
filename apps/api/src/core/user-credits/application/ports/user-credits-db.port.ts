import { User } from '@/core/users/domain/entities/user.entity';
import { UserCredit } from '../../domain/entities/user-credit.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';

export abstract class UserCreditsDbPort extends BaseDbPort<UserCredit> {
  abstract findByUserId(userId: User['id']): Promise<UserCredit | null>;
}
