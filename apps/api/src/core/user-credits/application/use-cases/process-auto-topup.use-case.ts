import { Injectable } from '@nestjs/common';
import { UserCreditsDbPort } from '../ports/user-credits-db.port';
import { AutoTopupConfigDbPort } from '../ports/auto-topup-config-db.port';
import { CreditTransactionDbPort } from '../ports/credit-transaction-db.port';
import { PaymentServicePort } from '../ports/payment-service.port';
import { TransactionStatus, TransactionType } from '../../domain/entities/credit-transaction.entity';
import { User } from '@/core/users/domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ProcessAutoTopupUseCase {
  constructor(
    private readonly userCreditRepository: UserCreditsDbPort,
    private readonly autoTopupConfigRepository: AutoTopupConfigDbPort,
    private readonly transactionRepository: CreditTransactionDbPort,
    private readonly paymentService: PaymentServicePort,
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Check if auto top-up should be triggered for a user
   * @param userId The user ID to check
   * @returns true if auto top-up was triggered, false otherwise
   */
  async checkAndProcessAutoTopup(userId: string): Promise<boolean> {
    // Get user credit account
    const userCredit = await this.userCreditRepository.findByUserId(userId);
    if (!userCredit) {
      this.logger.warn(`No credit account found for user ${userId}`);
      return false;
    }

    // Get auto top-up config
    const autoTopupConfig = await this.autoTopupConfigRepository.findByUserId(userId);
    if (!autoTopupConfig) {
      // No auto top-up configured
      return false;
    }

    // Check if auto top-up should be triggered
    if (!autoTopupConfig.shouldTriggerTopup(userCredit.balance)) {
      // Balance is above threshold or auto top-up is disabled
      return false;
    }

    // Get user payment information
    const userRef = userCredit.user;
    const user = userRef.unwrap() as User;

    if (!user.paymentExternalId) {
      this.logger.warn(`User ${userId} has auto top-up configured but no payment information`);
      return false;
    }

    try {
      // Process payment
      const amount = autoTopupConfig.amount;
      const paymentResponse = await this.paymentService.createPaymentIntent({
        customerId: user.paymentExternalId,
        amount,
        currency: 'USD',
        metadata: {
          userId,
          description: 'Automatic top-up',
          autoTopupId: autoTopupConfig.id,
        },
      });

      if (paymentResponse.status !== 'succeeded') {
        // Payment failed
        this.logger.error(`Auto top-up payment failed for user ${userId}: ${paymentResponse.status}`);

        // Create failed transaction record
        this.transactionRepository.create({
          user: userId,
          type: TransactionType.TOPUP,
          amount,
          balanceBefore: userCredit.balance,
          balanceAfter: userCredit.balance,
          status: TransactionStatus.FAILED,
          externalOperationId: paymentResponse.id,
          metadata: {
            description: 'Automatic top-up',
            paymentStatus: paymentResponse.status,
            autoTopupId: autoTopupConfig.id,
          },
        });
        await this.transactionRepository.save();
        return false;
      }

      // Payment succeeded, add credits
      const balanceBefore = userCredit.balance;
      userCredit.addCredits(amount);

      // Create transaction record
      this.transactionRepository.create({
        user: userId,
        type: TransactionType.TOPUP,
        amount,
        balanceBefore,
        balanceAfter: userCredit.balance,
        status: TransactionStatus.SUCCESSFUL,
        externalOperationId: paymentResponse.id,
        metadata: {
          description: 'Automatic top-up',
          autoTopupId: autoTopupConfig.id,
        },
      });

      // Update last triggered timestamp
      autoTopupConfig.updateLastTriggered();

      // Save changes
      await this.transactionRepository.save();

      this.logger.info(`Auto top-up successful for user ${userId}: added ${amount} credits`);
      return true;
    } catch (error) {
      this.logger.error(`Error processing auto top-up for user ${userId}: ${error.message}`, error.stack);

      // Create failed transaction record
      this.transactionRepository.create({
        user: userId,
        type: TransactionType.TOPUP,
        amount: autoTopupConfig.amount,
        balanceBefore: userCredit.balance,
        balanceAfter: userCredit.balance,
        status: TransactionStatus.FAILED,
        metadata: {
          description: 'Automatic top-up',
          error: error.message,
          autoTopupId: autoTopupConfig.id,
        },
      });
      await this.transactionRepository.save();
      return false;
    }
  }

  /**
   * Process auto top-ups for all users with enabled configurations
   * @returns Number of successful top-ups
   */
  async processAllAutoTopups(): Promise<number> {
    // Find all enabled auto top-up configurations
    const enabledConfigs = await this.autoTopupConfigRepository.findByEnabledStatus(true);

    this.logger.info(`Found ${enabledConfigs.length} enabled auto top-up configurations`);

    let successCount = 0;

    // Process each configuration
    for (const config of enabledConfigs) {
      const userRef = config.user;
      const userId = userRef.id;

      try {
        const success = await this.checkAndProcessAutoTopup(userId);
        if (success) {
          successCount++;
        }
      } catch (error) {
        this.logger.error(`Error processing auto top-up for user ${userId}: ${error.message}`, error.stack);
      }
    }

    return successCount;
  }
}
