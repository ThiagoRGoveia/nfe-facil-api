import { Global, Module } from '@nestjs/common';
import { CreditTransactionDbPort, PaymentServicePort } from './core/application/ports';
import { CreditTransactionMikroOrmDbRepository } from './core/infra/persistence/db/orm/credit-transaction-mikro-orm-db.repository';
import { TopupCreditsUseCase, HandleStripeEventUseCase, SpendCreditsUseCase } from './core/application/use-cases';
import { StripePaymentAdapter } from './core/infra/adapters/stripe';

@Global()
@Module({
  providers: [
    {
      provide: CreditTransactionDbPort,
      useClass: CreditTransactionMikroOrmDbRepository,
    },
    {
      provide: PaymentServicePort,
      useClass: StripePaymentAdapter,
    },
    HandleStripeEventUseCase,
    TopupCreditsUseCase,
    SpendCreditsUseCase,
  ],
  exports: [
    CreditTransactionDbPort,
    PaymentServicePort,
    HandleStripeEventUseCase,
    TopupCreditsUseCase,
    SpendCreditsUseCase,
  ],
})
export class UserCreditsModule {}
