import { Injectable, BadRequestException } from '@nestjs/common';
import { TopupCreditsDto } from '../dtos/topup-credits.dto';
import { CreditTransactionDbPort } from '../ports/credit-transaction-db.port';
import { TransactionStatus, TransactionType } from '../../domain/entities/credit-transaction.entity';
import { UserDbPort } from '@lib/users/users.module';

@Injectable()
export class TopupCreditsUseCase {
  constructor(
    private readonly userDbPort: UserDbPort,
    private readonly transactionRepository: CreditTransactionDbPort,
  ) {}

  async execute(params: TopupCreditsDto): Promise<boolean> {
    const { userId, amount, description, metadata } = params;
    const user = await this.userDbPort.findById(userId);
    if (!user) {
      throw new BadRequestException(`No credit account found for user ${userId}`);
    }

    // Process payment via payment service
    try {
      // Payment succeeded, add credits to user
      const balanceBefore = user.credits;
      user.addCredits(amount);

      // Create transaction record
      this.transactionRepository.create({
        user: userId,
        type: TransactionType.TOPUP,
        amount,
        balanceBefore,
        balanceAfter: user.credits,
        status: TransactionStatus.SUCCESSFUL,
        externalOperationId: params.externalOperationId,
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
        balanceBefore: user.credits,
        balanceAfter: user.credits,
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
