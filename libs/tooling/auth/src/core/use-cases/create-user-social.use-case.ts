import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDbPort } from '../../../../../features/users/src/core/application/ports/users-db.port';
import { CreateUserSocialDto } from '../../../../../features/users/src/core/application/dtos/create-user-social.dto';
import { User, UserRole } from '../../../../../features/users/src/core/domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { SecretAdapter } from '@lib/secrets/core/secret.adapter';
import { AuthPort } from '@lib/auth/core/ports/auth.port';

@Injectable()
export class CreateUserSocialUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly uuidAdapter: UuidAdapter,
    private readonly secretAdapter: SecretAdapter,
    private readonly authPort: AuthPort,
  ) {}

  async execute(data: CreateUserSocialDto): Promise<User> {
    try {
      const auth0User = await this.authPort.getUserInfo(data.auth0Id);

      const user = this.userDb.create({
        name: auth0User.givenName || auth0User.name,
        surname: auth0User.familyName,
        email: auth0User.email,
        auth0Id: data.auth0Id,
        clientId: this.uuidAdapter.generate(),
        clientSecret: this.secretAdapter.generate(),
        role: UserRole.CUSTOMER,
        credits: 0,
        isSocial: !data.auth0Id.includes('auth0'),
      });

      await this.userDb.save();
      return user;
    } catch (error) {
      this.logger.error('Failed to create social user: %s', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create social user');
    }
  }
}
