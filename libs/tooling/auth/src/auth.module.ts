import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyStrategy } from './core/api-key.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from './core/jwt.strategy';
import { RequestTypeGuard } from './core/request-type.guard';
import { RolesGuard } from './core/roles.guard';
import { AuthPort } from './core/ports/auth.port';
import { Auth0Client } from './core/auth0.client';
import { JwtAuthGuard } from './core/jwt.guard';
import { ApiKeyAuthGuard } from './core/api-key.guard';

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
