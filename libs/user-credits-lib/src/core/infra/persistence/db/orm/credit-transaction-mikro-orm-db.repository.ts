import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { CreditTransaction } from '@/core/user-credits/domain/entities/credit-transaction.entity';
import { CreditTransactionDbPort } from '@/core/user-credits/application/ports/credit-transaction-db.port';

@Injectable()
export class CreditTransactionMikroOrmDbRepository
  extends EntityRepository(CreditTransaction)
  implements CreditTransactionDbPort
{
  async findByPaymentExternalId(paymentExternalId: string): Promise<CreditTransaction | null> {
    return this.em.findOne(CreditTransaction, { externalOperationId: paymentExternalId });
  }
}
