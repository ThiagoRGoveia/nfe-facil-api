import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@lib/database/infra/persistence/repositories/_base-mikro-orm-db.repository';
import { CreditTransaction } from '@lib/user-credits/core/domain/entities';
import { CreditTransactionDbPort } from '@lib/user-credits/core/application/ports';

@Injectable()
export class CreditTransactionMikroOrmDbRepository
  extends EntityRepository(CreditTransaction)
  implements CreditTransactionDbPort
{
  async findByPaymentExternalId(paymentExternalId: string): Promise<CreditTransaction | null> {
    return this.em.findOne(CreditTransaction, { externalOperationId: paymentExternalId });
  }
}

export const CreditTransactionMikroOrmDbRepositoryProvider = {
  provide: CreditTransactionDbPort,
  useClass: CreditTransactionMikroOrmDbRepository,
};
