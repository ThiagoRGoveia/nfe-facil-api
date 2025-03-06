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
  abstract cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse>;
  abstract constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event;
}
