import { Injectable } from '@nestjs/common';
import { AutoTopupConfig } from '../../domain/entities/auto-topup-config.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { User } from '@/core/users/domain/entities/user.entity';

@Injectable()
export abstract class AutoTopupConfigDbPort extends BaseDbPort<AutoTopupConfig> {
  abstract findByUserId(userId: User['id']): Promise<AutoTopupConfig | null>;
  abstract findByEnabledStatus(enabled: boolean): Promise<AutoTopupConfig[]>;
}
