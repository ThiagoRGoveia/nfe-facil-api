import { Provider } from '@nestjs/common';
import { StripePaymentAdapter } from './stripe-payment.adapter';

export const STRIPE_PAYMENT_SERVICE = 'STRIPE_PAYMENT_SERVICE';

export const stripePaymentProvider: Provider = {
  provide: STRIPE_PAYMENT_SERVICE,
  useClass: StripePaymentAdapter,
};
