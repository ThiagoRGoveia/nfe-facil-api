import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

export interface PaymentCustomer {
  id: string;
  email: string;
  name?: string;
  externalId?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface SubscriptionCreateParams {
  customerId: string;
  planId: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  metadata?: Record<string, string>;
}

export interface SubscriptionResponse {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodEnd: Date;
  canceledAt?: Date;
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  id: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  metadata?: Record<string, string>;
}

export interface TopupParams {
  customerId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

@Injectable()
export abstract class PaymentServicePort {
  // Customer management
  abstract createCustomer(email: string, name?: string): Promise<PaymentCustomer>;
  abstract getCustomer(customerId: string): Promise<PaymentCustomer | null>;
  abstract updateCustomer(customerId: string, data: Partial<PaymentCustomer>): Promise<PaymentCustomer>;

  // Payment methods
  abstract getPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  abstract setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;

  // Subscription management
  abstract createSubscription(params: SubscriptionCreateParams): Promise<SubscriptionResponse>;
  abstract cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse>;
  abstract getSubscription(subscriptionId: string): Promise<SubscriptionResponse | null>;

  // One-time payments
  abstract createPaymentIntent(params: TopupParams): Promise<PaymentResponse>;
  abstract getPaymentIntent(paymentIntentId: string): Promise<PaymentResponse | null>;

  // Webhook handling
  abstract constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event;
}
