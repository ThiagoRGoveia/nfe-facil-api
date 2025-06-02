import { Injectable } from '@nestjs/common';
import { CreditSubscription, SubscriptionStatus } from '../../domain/entities/credit-subscription.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { User } from '@lib/users/core/domain/entities/user.entity';

@Injectable()
export abstract class CreditSubscriptionDbPort extends BaseDbPort<CreditSubscription> {
  abstract findByUserId(userId: User['id']): Promise<CreditSubscription[]>;
  abstract findActiveByUserId(userId: User['id']): Promise<CreditSubscription[]>;
  abstract findByStatus(status: SubscriptionStatus): Promise<CreditSubscription[]>;
  abstract findByExternalSubscriptionId(externalSubscriptionId: string): Promise<CreditSubscription | null>;
  abstract findSubscriptionsDueForRenewal(currentDate: Date): Promise<CreditSubscription[]>;
}
