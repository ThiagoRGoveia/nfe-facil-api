import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { PinoLogger } from 'nestjs-pino';

interface DeleteUserInput {
  id: number;
}

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute({ id }: DeleteUserInput): Promise<void> {
    try {
      await this.userDb.delete(id);
      await this.userDb.save();
    } catch (error) {
      this.logger.error({ err: error, userId: id }, 'Failed to delete user');
      throw new InternalServerErrorException('Failed to delete user from database');
    }
  }
}
