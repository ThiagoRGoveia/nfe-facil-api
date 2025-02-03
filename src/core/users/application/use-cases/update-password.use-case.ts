import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AuthPort } from '@/infra/auth/ports/auth.port';
import { UserDbPort } from '../ports/users-db.port';
import { UpdatePasswordDto } from '../dtos/update-password.dto';

interface UpdatePasswordCommand {
  id: number;
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
