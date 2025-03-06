import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentServicePort, SubscriptionResponse } from '../../../application/ports/payment-service.port';

@Injectable()
export class StripePaymentAdapter implements PaymentServicePort {
  private readonly stripe: Stripe;
  private readonly stripeWebhookSignature: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const webhookSignature = this.configService.get<string>('STRIPE_WEBHOOK_SIGNATURE');
    if (!webhookSignature) {
      throw new Error('STRIPE_WEBHOOK_SIGNATURE is not set');
    }
    this.stripeWebhookSignature = webhookSignature;

    this.stripe = new Stripe(apiKey);
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);

    return {
      id: subscription.id,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      metadata: subscription.metadata,
    };
  }

  /**
   * Validates and constructs a Stripe event from webhook payload
   */
  constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.stripeWebhookSignature);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Webhook Error: ${err.message}`);
      }
      throw new Error('Unknown webhook error');
    }
  }

  // Helper methods to map Stripe-specific statuses to our domain statuses
  private mapSubscriptionStatus(
    stripeStatus: string,
  ): 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid' {
    const statusMap: Record<string, 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid'> = {
      active: 'active',
      canceled: 'canceled',
      incomplete: 'incomplete',
      past_due: 'past_due',
      trialing: 'trialing',
      unpaid: 'unpaid',
    };

    return statusMap[stripeStatus] || 'incomplete';
  }

  private mapPaymentStatus(stripeStatus: string): 'succeeded' | 'pending' | 'failed' {
    const statusMap: Record<string, 'succeeded' | 'pending' | 'failed'> = {
      succeeded: 'succeeded',
      processing: 'pending',
      requires_payment_method: 'failed',
      requires_action: 'pending',
      requires_capture: 'pending',
      canceled: 'failed',
    };

    return statusMap[stripeStatus] || 'failed';
  }
}
