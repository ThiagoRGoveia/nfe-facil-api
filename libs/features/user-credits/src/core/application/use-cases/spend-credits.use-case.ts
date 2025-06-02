import { Injectable, BadRequestException } from '@nestjs/common';
import { SpendCreditsDto } from '../dtos/spend-credits.dto';
import { CreditTransactionDbPort } from '../ports/credit-transaction-db.port';
import { TransactionStatus, TransactionType } from '../../domain/entities/credit-transaction.entity';
import { UserDbPort } from '@lib/users/users.module';

@Injectable()
export class SpendCreditsUseCase {
  constructor(
    private readonly userDbPort: UserDbPort,
    private readonly transactionRepository: CreditTransactionDbPort,
  ) {}

  async execute(params: SpendCreditsDto): Promise<boolean> {
    const { userId, amount, operationId, description, metadata } = params;

    // Find user's credit account
    const user = await this.userDbPort.findById(userId);
    if (!user) {
      throw new BadRequestException(`No credit account found for user ${userId}`);
    }

    // Check if user has enough credits
    const balanceBefore = user.credits;
    const success = user.deductCredits(amount);

    // Create transaction record
    this.transactionRepository.create({
      user: userId,
      type: TransactionType.PURCHASE,
      amount,
      balanceBefore,
      balanceAfter: success ? balanceBefore - amount : balanceBefore,
      status: success ? TransactionStatus.SUCCESSFUL : TransactionStatus.FAILED,
      externalOperationId: operationId,
      metadata: {
        description,
        ...metadata,
      },
    });

    // If successful, save the updated credit balance
    if (success) {
      await this.userDbPort.save();
    }

    // Save the transaction record
    await this.transactionRepository.save();

    return success;
  }
}
