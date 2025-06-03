import { Injectable } from '@nestjs/common';
import { CreditTransaction } from '../../domain/entities/credit-transaction.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';

@Injectable()
export abstract class CreditTransactionDbPort extends BaseDbPort<CreditTransaction> {
  abstract findByPaymentExternalId(paymentExternalId: string): Promise<CreditTransaction | null>;
}
