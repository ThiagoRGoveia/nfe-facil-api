import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CancelSubscriptionDto } from '../dtos/cancel-subscription.dto';
import { CreditSubscriptionDbPort } from '../ports/credit-subscription-db.port';
import { PaymentServicePort } from '../ports/payment-service.port';
import { CreditSubscription } from '../../domain/entities/credit-subscription.entity';

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: CreditSubscriptionDbPort,
    private readonly paymentService: PaymentServicePort,
  ) {}

  async execute(params: CancelSubscriptionDto): Promise<CreditSubscription> {
    const { subscriptionId, userId } = params;

    // Find the subscription
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new BadRequestException(`Subscription with ID ${subscriptionId} not found`);
    }

    // Check if the subscription belongs to the user
    const subscriptionUserRef = subscription.user;
    if (subscriptionUserRef.id !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this subscription');
    }

    // Check if the subscription is already cancelled
    if (!subscription.isActive()) {
      throw new BadRequestException('Subscription is already cancelled or inactive');
    }

    // Cancel subscription in payment service
    try {
      if (subscription.externalSubscriptionId) {
        await this.paymentService.cancelSubscription(subscription.externalSubscriptionId);
      }

      // Update subscription status
      subscription.cancel();

      // Save changes
      await this.subscriptionRepository.save();

      return subscription;
    } catch (error) {
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }
}
