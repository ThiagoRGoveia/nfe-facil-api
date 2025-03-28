import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
import { CreditTransactionDbPort, PaymentServicePort } from './application/ports';
import { CreditTransactionMikroOrmDbRepository } from './infra/persistence/db/orm/credit-transaction-mikro-orm-db.repository';
import { TopupCreditsUseCase, HandleStripeEventUseCase } from './application/use-cases';
import { StripeController } from './presenters/http/controllers/stripe.controller';
import { StripePaymentAdapter } from './infra/adapters/stripe';

const controllers = [StripeController];
const providers = [
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
];
const exportValues = [CreditTransactionDbPort, PaymentServicePort, HandleStripeEventUseCase, TopupCreditsUseCase];

@Global()
@Module({
  // providers,
  // exports,
})
export class UserCreditsModule {
  static register(@Optional() @Inject('API_TYPE') apiType: 'rest' | 'graphql' | 'all' | 'none' = 'all'): DynamicModule {
    return {
      module: UserCreditsModule,
      controllers: apiType === 'rest' || apiType === 'all' ? controllers : [],
      providers,
      exports: exportValues,
    };
  }
}
