import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { PinoLogger } from 'nestjs-pino';
import { AuthPort } from '@lib/auth/core/ports/auth.port';
import { User } from '../../domain/entities/user.entity';

interface DeleteUserInput {
  id: User['id'];
}

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly authPort: AuthPort,
  ) {}

  async execute({ id }: DeleteUserInput): Promise<void> {
    const user = await this.userDb.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    try {
      await this.userDb.delete(id);
      await this.authPort.deleteUser(user.auth0Id);
      await this.userDb.save();
    } catch (error) {
      this.logger.error({ err: error, userId: id }, 'Failed to delete user');
      throw new InternalServerErrorException('Failed to delete user from database');
    }
  }
}
