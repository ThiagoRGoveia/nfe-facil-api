import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { CreateUserSocialDto } from '../dtos/create-user-social.dto';
import { User, UserRole } from '../../domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { SecretAdapter } from '@/infra/adapters/secret.adapter';
import { Auth0Client } from '@/infra/auth/auth0.client';

@Injectable()
export class CreateUserSocialUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly uuidAdapter: UuidAdapter,
    private readonly secretAdapter: SecretAdapter,
    private readonly auth0Client: Auth0Client,
  ) {}

  async execute(data: CreateUserSocialDto): Promise<User> {
    try {
      const userInfo = await this.auth0Client.getUserInfo(data.auth0Id);
      const user = this.userDb.create({
        name: userInfo.data.given_name || userInfo.data.name,
        surname: userInfo.data.family_name,
        email: userInfo.data.email,
        auth0Id: data.auth0Id,
        clientId: this.uuidAdapter.generate(),
        clientSecret: this.secretAdapter.generate(),
        role: UserRole.CUSTOMER,
        credits: 0,
        isSocial: true,
      });

      await this.userDb.save();
      return user;
    } catch (error) {
      this.logger.error('Failed to create social user:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create social user');
    }
  }
}
