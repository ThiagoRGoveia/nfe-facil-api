import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetUsers200ResponseOneOfInner, ManagementClient } from 'auth0';
import { AuthPort, AuthUserDto } from './ports/auth.port';

export class Auth0UserMapper {
  static toDto(auth0User: GetUsers200ResponseOneOfInner): AuthUserDto {
    return {
      userId: auth0User.user_id,
      email: auth0User.email,
      emailVerified: auth0User.email_verified,
      username: auth0User.username,
      phoneNumber: auth0User.phone_number,
      phoneVerified: auth0User.phone_verified,
      picture: auth0User.picture,
      name: auth0User.name,
      blocked: auth0User.blocked,
      givenName: auth0User.given_name,
      familyName: auth0User.family_name,
    };
  }
}

@Injectable()
export class Auth0Client implements AuthPort {
  public client: ManagementClient;

  constructor(private readonly configService: ConfigService) {
    const domain = this.configService.get<string>('AUTH_DOMAIN');
    const clientId = this.configService.get<string>('AUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AUTH_CLIENT_SECRET');

    if (!domain || !clientId || !clientSecret) {
      throw new Error('Missing required Auth0 configuration');
    }

    this.client = new ManagementClient({
      domain: domain.replace('https://', ''),
      clientId,
      clientSecret,
      audience: `${domain}/api/v2/`,
    });
  }

  async getUserInfo(userId: string): Promise<AuthUserDto> {
    try {
      const user = await this.client.users.get({ id: userId });
      return Auth0UserMapper.toDto(user.data);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new NotFoundException('User not found');
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new UnauthorizedException('Not authorized to get user info');
      }
      throw new InternalServerErrorException('Failed to get user info from Auth0');
    }
  }

  async createUser(email: string, password: string): Promise<AuthUserDto> {
    try {
      const response = await this.client.users.create({
        email,
        password,
        connection: 'Username-Password-Authentication',
        email_verified: false,
      });
      return Auth0UserMapper.toDto(response.data);
    } catch (error) {
      if (error.statusCode === 409) {
        throw new BadRequestException('User already exists');
      }
      if (error.statusCode === 400) {
        throw new BadRequestException(error.message);
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new UnauthorizedException('Not authorized to create users');
      }
      throw new InternalServerErrorException('Failed to create user in Auth0');
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<AuthUserDto> {
    try {
      const response = await this.client.users.update({ id: userId }, { password: newPassword });
      return Auth0UserMapper.toDto(response.data);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new NotFoundException('User not found');
      }
      if (error.statusCode === 400) {
        throw new BadRequestException(error.message);
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new UnauthorizedException('Not authorized to update user password');
      }
      throw new InternalServerErrorException('Failed to update password in Auth0');
    }
  }

  async disableUser(userId: string): Promise<AuthUserDto> {
    try {
      const response = await this.client.users.update({ id: userId }, { blocked: true });
      return Auth0UserMapper.toDto(response.data);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new NotFoundException('User not found');
      }
      if (error.statusCode === 400) {
        throw new BadRequestException(error.message);
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new UnauthorizedException('Not authorized to disable users');
      }
      throw new InternalServerErrorException('Failed to disable user in Auth0');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.users.delete({ id: userId });
    } catch (error) {
      if (error.statusCode === 404) {
        throw new NotFoundException('User not found');
      }
      if (error.statusCode === 400) {
        throw new BadRequestException(error.message);
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new UnauthorizedException('Not authorized to delete users');
      }
      throw new InternalServerErrorException('Failed to delete user in Auth0');
    }
  }
}
