import { Global, Module } from '@nestjs/common';
import { CreditTransactionDbPort, PaymentServicePort } from './application/ports';
import { CreditTransactionMikroOrmDbRepository } from './infra/persistence/db/orm/credit-transaction-mikro-orm-db.repository';
import { TopupCreditsUseCase, HandleStripeEventUseCase } from './application/use-cases';
import { StripeController } from './presenters/http/controllers/stripe.controller';
import { StripePaymentAdapter } from './infra/adapters/stripe';
@Global()
@Module({
  controllers: [StripeController],
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
  ],
  exports: [],
})
export class UserCreditsModule {}
