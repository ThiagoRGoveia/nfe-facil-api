import { Injectable, BadRequestException } from '@nestjs/common';
import { TopupCreditsDto } from '../dtos/topup-credits.dto';
import { UserCreditsDbPort } from '../ports/user-credits-db.port';
import { CreditTransactionDbPort } from '../ports/credit-transaction-db.port';
import { PaymentServicePort } from '../ports/payment-service.port';
import { TransactionStatus, TransactionType } from '../../domain/entities/credit-transaction.entity';
import { User } from '@/core/users/domain/entities/user.entity';

@Injectable()
export class TopupCreditsUseCase {
  constructor(
    private readonly userCreditRepository: UserCreditsDbPort,
    private readonly transactionRepository: CreditTransactionDbPort,
    private readonly paymentService: PaymentServicePort,
  ) {}

  async execute(params: TopupCreditsDto): Promise<boolean> {
    const { userId, amount, description, metadata } = params;
    // Note: paymentMethodId is not currently used but would be passed to payment service
    // in a real implementation that supports multiple payment methods

    // Find user's credit account
    const userCredit = await this.userCreditRepository.findByUserId(userId);
    if (!userCredit) {
      throw new BadRequestException(`No credit account found for user ${userId}`);
    }

    // TODO: Get user's payment information
    // Current implementation uses reference to user entity, we need to unwrap it
    const userRef = userCredit.user;
    // In a real implementation, we would properly access the user entity and get paymentExternalId
    // For now, using type assertion to avoid TypeScript errors
    const user = userRef.unwrap() as User;

    if (!user.paymentExternalId) {
      throw new BadRequestException('User does not have payment information configured');
    }

    // Process payment via payment service
    try {
      const paymentResponse = await this.paymentService.createPaymentIntent({
        customerId: user.paymentExternalId,
        amount,
        currency: 'USD', // TODO: Configure currency from environment or settings
        metadata: {
          userId,
          description: description || 'Credit top-up',
          ...metadata,
        },
      });

      if (paymentResponse.status !== 'succeeded') {
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
            description,
            paymentStatus: paymentResponse.status,
            ...metadata,
          },
        });
        await this.transactionRepository.save();
        return false;
      }

      // Payment succeeded, add credits to user
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
          description,
          ...metadata,
        },
      });

      // Save changes
      await this.transactionRepository.save();

      return true;
    } catch (error) {
      // Handle payment errors
      // Create failed transaction record
      this.transactionRepository.create({
        user: userId,
        type: TransactionType.TOPUP,
        amount,
        balanceBefore: userCredit.balance,
        balanceAfter: userCredit.balance,
        status: TransactionStatus.FAILED,
        metadata: {
          description,
          error: error.message,
          ...metadata,
        },
      });
      await this.transactionRepository.save();

      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
  }
}
