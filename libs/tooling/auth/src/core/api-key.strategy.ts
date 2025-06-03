import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';
import { UserDbPort } from '@lib/users/users.module';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(BasicStrategy, 'api-key') {
  constructor(private readonly userDb: UserDbPort) {
    super();
  }

  async validate(apiKey: string, apiSecret: string): Promise<any> {
    const user = await this.userDb.findByClientId(apiKey);

    if (!user || user.clientSecret !== apiSecret) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
