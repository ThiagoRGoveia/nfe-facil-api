import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
import { CreditTransactionDbPort, PaymentServicePort } from './core/application/ports';
import { CreditTransactionMikroOrmDbRepository } from './core/infra/persistence/db/orm/credit-transaction-mikro-orm-db.repository';
import { TopupCreditsUseCase, HandleStripeEventUseCase, SpendCreditsUseCase } from './core/application/use-cases';
import { StripeController } from './core/presenters/http/controllers/stripe.controller';
import { StripePaymentAdapter } from './core/infra/adapters/stripe';

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
  SpendCreditsUseCase,
];
const exportValues = [
  CreditTransactionDbPort,
  PaymentServicePort,
  HandleStripeEventUseCase,
  TopupCreditsUseCase,
  SpendCreditsUseCase,
];

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
