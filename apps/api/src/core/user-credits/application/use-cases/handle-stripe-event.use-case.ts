import { Injectable, Logger } from '@nestjs/common';
import { PaymentServicePort } from '../ports/payment-service.port';
import { TopupCreditsUseCase } from './topup-credits.use-case';
import Stripe from 'stripe';

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
  ) {}

  async execute(params: StripeEventDto): Promise<boolean> {
    try {
      // Verify and parse the Stripe event
      const event = this.paymentService.constructWebhookEvent(params.payload, params.signature);

      // Process different event types
      switch (event.type) {
        case 'invoice.paid':
          return this.handleInvoicePaid(event.data.object);

        case 'customer.subscription.created':
          return this.handleSubscriptionCreated(event.data.object);

        case 'customer.subscription.updated':
          return this.handleSubscriptionUpdated(event.data.object);

        case 'customer.subscription.deleted':
          return this.handleSubscriptionDeleted(event.data.object);

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
          return true; // Successfully processed but took no action
      }
    } catch (error) {
      this.logger.error(`Error processing Stripe webhook: ${error.message}`, error.stack);
      throw error; // Let the controller handle the exception
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<boolean> {
    try {
      // Extract customer and subscription info
      const customerId = invoice.customer as string;
      const amount = invoice.amount_paid / 100; // Convert from cents to dollars

      if (amount <= 0) {
        this.logger.log(`Invoice ${invoice.id} has zero amount paid, skipping credit top-up`);
        return true;
      }

      // Get metadata to find our internal user ID
      // First check subscription if it exists
      let userId: string | undefined;
      let metadata: Record<string, any> = {};

      if (invoice.subscription) {
        const subscription = await this.paymentService.getSubscription(invoice.subscription as string);
        if (subscription) {
          metadata = subscription.metadata || {};
          userId = metadata.userId;
        }
      }

      // If userId not in subscription metadata, try to get it from customer metadata
      if (!userId) {
        const customer = await this.paymentService.getCustomer(customerId);
        if (customer) {
          // Could retrieve userId from customer metadata if you store it there
          // This would depend on your customer creation implementation
        }
      }

      if (!userId) {
        this.logger.error(`Could not determine userId from invoice payment ${invoice.id}`);
        return false;
      }

      // Add credits to the user's account based on the payment amount
      await this.topupCreditsUseCase.execute({
        userId,
        amount,
        description: `Credits from subscription payment - Invoice ${invoice.number}`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          stripeCustomerId: customerId,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error processing invoice.paid event: ${error.message}`, error.stack);
      // We don't rethrow here to avoid sending error response to Stripe
      // which would cause them to retry the webhook
      return false;
    }
  }

  private handleSubscriptionCreated(subscription: Stripe.Subscription): boolean {
    try {
      // Get subscription metadata
      const metadata = subscription.metadata || {};
      const userId = metadata.userId;

      // Log the event
      this.logger.log(`Subscription created: ${subscription.id} for user ${userId || 'unknown'}`);

      // Here you would implement subscription creation logic:
      // - Update user subscription status in database
      // - Grant initial credits
      // - Send welcome email

      // For now, we're just returning true since this is a placeholder
      return true;
    } catch (error) {
      this.logger.error(`Error processing subscription.created event: ${error.message}`, error.stack);
      return false;
    }
  }

  private handleSubscriptionUpdated(subscription: Stripe.Subscription): boolean {
    try {
      // Get subscription metadata
      const metadata = subscription.metadata || {};
      const userId = metadata.userId;

      // Log the event
      this.logger.log(`Subscription updated: ${subscription.id} for user ${userId || 'unknown'}`);

      // Here you would implement subscription update logic:
      // - Update user subscription status in database
      // - Adjust credit limits or features based on new plan
      // - Handle upgrades/downgrades

      // For now, we're just returning true since this is a placeholder
      return true;
    } catch (error) {
      this.logger.error(`Error processing subscription.updated event: ${error.message}`, error.stack);
      return false;
    }
  }

  private handleSubscriptionDeleted(subscription: Stripe.Subscription): boolean {
    try {
      // Get subscription metadata
      const metadata = subscription.metadata || {};
      const userId = metadata.userId;

      // Log the event
      this.logger.log(`Subscription deleted: ${subscription.id} for user ${userId || 'unknown'}`);

      // Here you would implement subscription deletion logic:
      // - Update user subscription status in database
      // - Remove special features or access
      // - Send cancellation confirmation

      // For now, we're just returning true since this is a placeholder
      return true;
    } catch (error) {
      this.logger.error(`Error processing subscription.deleted event: ${error.message}`, error.stack);
      return false;
    }
  }
}
