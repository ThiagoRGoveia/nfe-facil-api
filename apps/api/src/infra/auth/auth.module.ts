import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyStrategy } from './api-key.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from './jwt.strategy';
import { RequestTypeGuard } from './request-type.guard';
import { RolesGuard } from './roles.guard';
import { AuthPort } from './ports/auth.port';
import { Auth0Client } from './auth0.client';
import { JwtAuthGuard } from './jwt.guard';
import { ApiKeyAuthGuard } from './api-key.guard';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'api-key' })],
  providers: [
    ApiKeyStrategy,
    JwtStrategy,
    JwtAuthGuard,
    ApiKeyAuthGuard,
    {
      provide: APP_GUARD,
      useClass: RequestTypeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: AuthPort,
      useClass: Auth0Client,
    },
  ],
  exports: [PassportModule, AuthPort],
})
export class AuthModule {}
