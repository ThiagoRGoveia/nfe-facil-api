import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AuthPort } from '@lib/auth/core/ports/auth.port';
import { UserDbPort } from '../ports/users-db.port';
import { UpdatePasswordDto } from '../dtos/update-password.dto';
import { User } from '../../domain/entities/user.entity';

interface UpdatePasswordCommand {
  id: User['id'];
  data: UpdatePasswordDto;
}

@Injectable()
export class UpdatePasswordUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly authPort: AuthPort,
  ) {}

  async execute({ id, data }: UpdatePasswordCommand): Promise<boolean> {
    try {
      const user = await this.userDb.findById(id);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Update password in Auth0
      await this.authPort.updatePassword(user.auth0Id, data.newPassword);

      return true;
    } catch (error) {
      this.logger.error('Failed to update user password:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update password');
    }
  }
}
