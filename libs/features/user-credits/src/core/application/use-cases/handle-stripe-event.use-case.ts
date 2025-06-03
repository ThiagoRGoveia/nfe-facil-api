import { Injectable, Logger } from '@nestjs/common';
import { PaymentServicePort } from '../ports/payment-service.port';
import { TopupCreditsUseCase } from './topup-credits.use-case';
import Stripe from 'stripe';
import { CreditTransactionDbPort } from '../ports';

export interface StripeEventDto {
  payload: Buffer | string;
  signature: string;
}

@Injectable()
export class HandleStripeEventUseCase {
  private readonly logger = new Logger(HandleStripeEventUseCase.name);

  constructor(
    private readonly paymentService: PaymentServicePort,
    private readonly topupCreditsUseCase: TopupCreditsUseCase,
    private readonly creditTransactionDbPort: CreditTransactionDbPort,
  ) {}

  async execute(params: StripeEventDto): Promise<boolean> {
    try {
      // Verify and parse the Stripe event
      const event = this.paymentService.constructWebhookEvent(params.payload, params.signature);

      // Process different event types
      switch (event.type) {
        case 'checkout.session.completed':
          return this.handleCreditsPurchase(event.data.object);

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
          return true; // Successfully processed but took no action
      }
    } catch (error) {
      this.logger.error(`Error processing Stripe webhook: ${error.message}`, error.stack);
      throw error; // Let the controller handle the exception
    }
  }

  private async handleCreditsPurchase(session: Stripe.Checkout.Session): Promise<boolean> {
    try {
      const creditsBundle = Number(session.metadata?.credits);
      const bundlePrice = Number(session.metadata?.price);
      const userId = session.client_reference_id;
      if (!userId || !creditsBundle || !bundlePrice || isNaN(creditsBundle) || isNaN(bundlePrice)) {
        this.logger.error(`Missing metadata for credits purchase`);
        return false;
      }
      const amount = session.amount_subtotal ? Number(session.amount_subtotal) / 100 : 0;
      const numberOfCredits = Math.floor(amount / bundlePrice) * creditsBundle;

      const existingTransaction = await this.creditTransactionDbPort.findByPaymentExternalId(session.id);
      if (existingTransaction) {
        this.logger.warn(`Transaction already exists for payment ${session.id}`);
        return true;
      }

      // Add credits to the user's account based on the payment amount
      await this.topupCreditsUseCase.execute({
        userId,
        amount: Number(numberOfCredits.toFixed(0)),
        description: `Credits from subscription payment - Invoice ${session.id}`,
        externalOperationId: session.id,
        metadata: {
          session,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error processing invoice.paid event: ${error.message}`, error.stack);
      return false;
    }
  }
}
