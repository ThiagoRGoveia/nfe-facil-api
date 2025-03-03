import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  PaymentCustomer,
  PaymentMethod,
  PaymentResponse,
  PaymentServicePort,
  SubscriptionCreateParams,
  SubscriptionResponse,
  TopupParams,
} from '../../../application/ports/payment-service.port';

@Injectable()
export class StripePaymentAdapter implements PaymentServicePort {
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    this.stripe = new Stripe(apiKey);
  }

  // Customer management
  async createCustomer(email: string, name?: string): Promise<PaymentCustomer> {
    const customer = await this.stripe.customers.create({
      email,
      name,
    });

    return {
      id: customer.id,
      email: customer.email ?? email,
      name: customer.name ?? undefined,
      externalId: customer.id,
    };
  }

  async getCustomer(customerId: string): Promise<PaymentCustomer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return null;
      }

      return {
        id: customer.id,
        email: customer.email ?? '',
        name: customer.name ?? undefined,
        externalId: customer.id,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  async updateCustomer(customerId: string, data: Partial<PaymentCustomer>): Promise<PaymentCustomer> {
    const customer = await this.stripe.customers.update(customerId, {
      email: data.email,
      name: data.name,
    });

    return {
      id: customer.id,
      email: customer.email ?? '',
      name: customer.name ?? undefined,
      externalId: customer.id,
    };
  }

  // Payment methods
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Get customer to check default payment method
    const customer = await this.stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId =
      typeof customer !== 'string' && !customer.deleted
        ? (customer.invoice_settings?.default_payment_method as string | undefined)
        : undefined;

    return paymentMethods.data.map((pm) => {
      const card = pm.card;
      return {
        id: pm.id,
        type: pm.type,
        last4: card?.last4 ?? '****',
        expiryMonth: card?.exp_month ?? 0,
        expiryYear: card?.exp_year ?? 0,
        isDefault: pm.id === defaultPaymentMethodId,
      };
    });
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // Subscription management
  async createSubscription(params: SubscriptionCreateParams): Promise<SubscriptionResponse> {
    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.planId }],
      metadata: params.metadata,
    });

    return {
      id: subscription.id,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      metadata: subscription.metadata,
    };
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

  async getSubscription(subscriptionId: string): Promise<SubscriptionResponse | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        id: subscription.id,
        status: this.mapSubscriptionStatus(subscription.status),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        metadata: subscription.metadata,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  // One-time payments
  async createPaymentIntent(params: TopupParams): Promise<PaymentResponse> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      customer: params.customerId,
      metadata: params.metadata,
    });

    return {
      id: paymentIntent.id,
      status: this.mapPaymentStatus(paymentIntent.status),
      amount: paymentIntent.amount / 100, // Convert from cents to currency units
      metadata: paymentIntent.metadata,
    };
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentResponse | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        status: this.mapPaymentStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100, // Convert from cents to currency units
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  // Webhook handling
  /**
   * Validates and constructs a Stripe event from webhook payload
   */
  constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Webhook Error: ${err.message}`);
      }
      throw new Error('Unknown webhook error');
    }
  }

  /**
   * @deprecated Use constructWebhookEvent instead for more control over event handling
   */
  handleWebhookEvent(payload: Buffer | string, signature: string): void {
    try {
      const event = this.constructWebhookEvent(payload, signature);

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          // Handle successful payment
          console.log('Payment intent succeeded:', paymentIntent.id);
          break;
        }

        case 'invoice.payment_succeeded':
        case 'invoice.paid': {
          const invoice = event.data.object;
          // Handle successful invoice payment
          console.log('Invoice payment succeeded:', invoice.id);
          break;
        }

        case 'checkout.session.completed': {
          const session = event.data.object;
          // Handle completed purchase
          console.log('Checkout session completed:', session.id);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
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
