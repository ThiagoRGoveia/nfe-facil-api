// import { Injectable, BadRequestException } from '@nestjs/common';
// import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
// import { UserCreditsDbPort } from '../ports/user-credits-db.port';
// import { CreditSubscriptionDbPort } from '../ports/credit-subscription-db.port';
// import { PaymentServicePort } from '../ports/payment-service.port';
// import { CreditSubscription, SubscriptionStatus } from '../../domain/entities/credit-subscription.entity';

// @Injectable()
// export class CreateSubscriptionUseCase {
//   constructor(
//     private readonly userCreditRepository: UserCreditsDbPort,
//     private readonly subscriptionRepository: CreditSubscriptionDbPort,
//     private readonly paymentService: PaymentServicePort,
//   ) {}

//   async execute(params: CreateSubscriptionDto): Promise<CreditSubscription> {
//     const { userId, creditAmount, interval, metadata } = params;

//     // Find user's credit account
//     const userCredit = await this.userCreditRepository.findByUserId(userId);
//     if (!userCredit) {
//       throw new BadRequestException(`No credit account found for user ${userId}`);
//     }

//     // Check if user already has an active subscription
//     const activeSubscriptions = await this.subscriptionRepository.findActiveByUserId(userId);
//     if (activeSubscriptions && activeSubscriptions.length > 0) {
//       throw new BadRequestException('User already has an active subscription');
//     }

//     // Get user's payment information
//     const user = await userCredit.user.load();

//     if (!user?.paymentExternalId) {
//       throw new BadRequestException('User does not have payment information configured');
//     }

//     // Create subscription in payment service
//     try {
//       // TODO: Determine the planId based on the credit amount and interval
//       // This might come from a configuration or another service
//       const planId = `credits-${creditAmount}-${interval}`;

//       const subscriptionResponse = await this.paymentService.createSubscription({
//         customerId: user.paymentExternalId,
//         planId,
//         interval: interval.toLowerCase() as 'monthly' | 'quarterly' | 'yearly',
//         metadata: {
//           userId,
//           creditAmount: creditAmount.toString(),
//           ...metadata,
//         },
//       });

//       // Create subscription entity
//       const subscription = this.subscriptionRepository.create({
//         user: userId,
//         creditAmount,
//         interval,
//         status: subscriptionResponse.status === 'active' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.FAILED,
//         externalSubscriptionId: subscriptionResponse.id,
//         nextRenewalDate: subscriptionResponse.currentPeriodEnd,
//       });

//       // Save the subscription
//       await this.subscriptionRepository.save();

//       return subscription;
//     } catch (error) {
//       throw new BadRequestException(`Failed to create subscription: ${error.message}`);
//     }
//   }
// }
