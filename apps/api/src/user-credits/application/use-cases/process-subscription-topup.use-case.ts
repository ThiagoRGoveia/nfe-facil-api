// NOTICE: we might not need this since stripe has a webhook for subscription status changes

import { Injectable } from '@nestjs/common';
import { CreditSubscriptionDbPort } from '../ports/credit-subscription-db.port';
import { UserCreditsDbPort } from '../ports/user-credits-db.port';
import { CreditTransactionDbPort } from '../ports/credit-transaction-db.port';
import { PaymentServicePort } from '../ports/payment-service.port';
import { TransactionStatus, TransactionType } from '../../domain/entities/credit-transaction.entity';
import { SubscriptionStatus } from '../../domain/entities/credit-subscription.entity';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ProcessSubscriptionTopupUseCase {
  constructor(
    private readonly subscriptionRepository: CreditSubscriptionDbPort,
    private readonly userCreditRepository: UserCreditsDbPort,
    private readonly transactionRepository: CreditTransactionDbPort,
    private readonly paymentService: PaymentServicePort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(): Promise<number> {
    const currentDate = new Date();

    // Find all subscriptions due for renewal
    const dueSubscriptions = await this.subscriptionRepository.findSubscriptionsDueForRenewal(currentDate);

    this.logger.info(`Found ${dueSubscriptions.length} subscriptions due for renewal`);

    let successCount = 0;

    // Process each subscription
    for (const subscription of dueSubscriptions) {
      try {
        // Skip inactive subscriptions
        if (!subscription.isActive()) {
          this.logger.debug(`Skipping inactive subscription ${subscription.id}`);
          continue;
        }

        // Get user credit account
        const userRef = subscription.user;
        const userId = userRef.id;
        const userCredit = await this.userCreditRepository.findByUserId(userId);

        if (!userCredit) {
          this.logger.error(`No credit account found for user ${userId}`);
          continue;
        }

        // Check subscription in payment provider
        if (subscription.externalSubscriptionId) {
          const externalSubscription = await this.paymentService.getSubscription(subscription.externalSubscriptionId);

          // Skip if external subscription is not active
          if (!externalSubscription || externalSubscription.status !== 'active') {
            this.logger.warn(
              `External subscription ${subscription.externalSubscriptionId} is not active: ${externalSubscription?.status}`,
            );

            // Update subscription status if needed
            if (subscription.isActive()) {
              subscription.status =
                externalSubscription?.status === 'canceled' ? SubscriptionStatus.CANCELLED : SubscriptionStatus.FAILED;
              await this.subscriptionRepository.save();
            }

            continue;
          }
        }

        // Process the top-up
        const balanceBefore = userCredit.balance;
        const amount = subscription.creditAmount;

        // Add credits to user's account
        userCredit.addCredits(amount);

        // Create transaction record
        this.transactionRepository.create({
          user: userId,
          type: TransactionType.SUBSCRIPTION,
          amount,
          balanceBefore,
          balanceAfter: userCredit.balance,
          status: TransactionStatus.SUCCESSFUL,
          subscriptionId: subscription.id,
          metadata: {
            subscriptionId: subscription.id,
            externalSubscriptionId: subscription.externalSubscriptionId,
          },
        });
        await this.transactionRepository.save();

        // Update next renewal date
        subscription.updateNextRenewalDate();
        // Save changes
        await this.subscriptionRepository.save();

        successCount++;
        this.logger.info(`Successfully processed subscription top-up for subscription ${subscription.id}`);
      } catch (error) {
        this.logger.error(`Error processing subscription ${subscription.id}: ${error.message}`, error.stack);

        // Create failed transaction record
        try {
          const userRef = subscription.user;
          const userId = userRef.id;
          const userCredit = await this.userCreditRepository.findByUserId(userId);

          if (userCredit) {
            this.transactionRepository.create({
              user: userId,
              type: TransactionType.SUBSCRIPTION,
              amount: subscription.creditAmount,
              balanceBefore: userCredit.balance,
              balanceAfter: userCredit.balance,
              status: TransactionStatus.FAILED,
              subscriptionId: subscription.id,
              metadata: {
                error: error.message,
                subscriptionId: subscription.id,
              },
            });

            await this.transactionRepository.save();
          }
        } catch (transactionError) {
          this.logger.error(`Failed to create transaction record for failed subscription: ${transactionError.message}`);
        }
      }
    }

    return successCount;
  }
}
