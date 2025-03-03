import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigureAutoTopupDto } from '../dtos/configure-auto-topup.dto';
import { UserCreditsDbPort } from '../ports/user-credits-db.port';
import { AutoTopupConfigDbPort } from '../ports/auto-topup-config-db.port';
import { AutoTopupConfig } from '../../domain/entities/auto-topup-config.entity';

@Injectable()
export class ConfigureAutoTopupUseCase {
  constructor(
    private readonly userCreditRepository: UserCreditsDbPort,
    private readonly autoTopupConfigRepository: AutoTopupConfigDbPort,
  ) {}

  async execute(params: ConfigureAutoTopupDto): Promise<AutoTopupConfig> {
    const { userId, threshold, amount, enabled = true } = params;

    // Validate parameters
    if (threshold <= 0) {
      throw new BadRequestException('Threshold must be greater than zero');
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Check if user exists
    const userCredit = await this.userCreditRepository.findByUserId(userId);
    if (!userCredit) {
      throw new BadRequestException(`No credit account found for user ${userId}`);
    }

    // Check if auto-topup config already exists for this user
    let autoTopupConfig = await this.autoTopupConfigRepository.findByUserId(userId);

    if (autoTopupConfig) {
      // Update existing config
      autoTopupConfig = this.autoTopupConfigRepository.update(autoTopupConfig.id, {
        threshold,
        amount,
        enabled,
      });
    } else {
      // Create new config
      autoTopupConfig = this.autoTopupConfigRepository.create({
        user: userId,
        threshold,
        amount,
        enabled,
      });
    }

    // Save the config
    await this.autoTopupConfigRepository.save();

    return autoTopupConfig;
  }
}
