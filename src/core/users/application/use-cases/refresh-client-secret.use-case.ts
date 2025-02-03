import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { User } from '../../domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { SecretAdapter } from '@/infra/adapters/secret.adapter';

interface RefreshClientSecretInput {
  id: User['id'];
}

@Injectable()
export class RefreshClientSecretUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly secretAdapter: SecretAdapter,
  ) {}

  async execute({ id }: RefreshClientSecretInput): Promise<User> {
    try {
      const user = await this.userDb.exists(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = this.userDb.update(id, { clientSecret: this.secretAdapter.generate() });
      await this.userDb.save();

      return updatedUser;
    } catch (error) {
      this.logger.error({ err: error, userId: id }, 'Failed to refresh user client secret');
      throw error;
    }
  }
}
