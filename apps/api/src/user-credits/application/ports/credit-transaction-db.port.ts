import { Injectable } from '@nestjs/common';
import { CreditTransaction, TransactionStatus, TransactionType } from '../../domain/entities/credit-transaction.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { User } from '@/core/users/domain/entities/user.entity';

@Injectable()
export abstract class CreditTransactionDbPort extends BaseDbPort<CreditTransaction> {
  abstract findByUserId(userId: User['id']): Promise<CreditTransaction[]>;
  abstract findByUserIdAndType(userId: User['id'], type: TransactionType): Promise<CreditTransaction[]>;
  abstract findByUserIdAndStatus(userId: User['id'], status: TransactionStatus): Promise<CreditTransaction[]>;
  abstract findByExternalOperationId(externalOperationId: string): Promise<CreditTransaction | null>;
}
