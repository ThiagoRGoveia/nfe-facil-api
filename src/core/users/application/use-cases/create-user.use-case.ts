import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User } from '../../domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { SecretAdapter } from '@/infra/adapters/secret.adapter';
import { Auth0Client } from '@/infra/auth/auth0.client';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly uuidAdapter: UuidAdapter,
    private readonly secretAdapter: SecretAdapter,
    private readonly auth0Client: Auth0Client,
  ) {}

  async execute(data: CreateUserDto): Promise<User> {
    try {
      const { password, ...userDataWithoutPassword } = data;
      const auth0Response = await this.auth0Client.createUser(data.email, password);

      if (!auth0Response.data.user_id) {
        throw new BadRequestException('Failed to get Auth0 user ID');
      }

      // Create user in our database without the password
      const user = this.userDb.create({
        ...userDataWithoutPassword,
        clientId: this.uuidAdapter.generate(),
        clientSecret: this.secretAdapter.generate(),
        auth0Id: auth0Response.data.user_id,
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
