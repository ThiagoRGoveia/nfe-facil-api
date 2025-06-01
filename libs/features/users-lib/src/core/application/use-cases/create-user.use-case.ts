import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User } from '../../domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { SecretAdapter } from '@/infra/adapters/secret.adapter';
import { AuthPort } from '@/infra/auth/ports/auth.port';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly uuidAdapter: UuidAdapter,
    private readonly secretAdapter: SecretAdapter,
    private readonly authPort: AuthPort,
  ) {}

  async execute(data: CreateUserDto): Promise<User> {
    try {
      const { password, ...userDataWithoutPassword } = data;
      const auth0User = await this.authPort.createUser(data.email, password);

      if (!auth0User.userId) {
        throw new BadRequestException('Failed to create user');
      }

      // Create user in our database without the password
      const user = this.userDb.create({
        ...userDataWithoutPassword,
        clientId: this.uuidAdapter.generate(),
        clientSecret: this.secretAdapter.generate(),
        auth0Id: auth0User.userId,
      });

      await this.userDb.save();
      return user;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }
}
