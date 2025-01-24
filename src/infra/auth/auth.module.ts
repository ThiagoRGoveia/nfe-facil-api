import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyStrategy } from './api-key.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from './jwt.strategy';
import { RequestTypeGuard } from './request-type.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'api-key' })],
  providers: [
    ApiKeyStrategy,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RequestTypeGuard,
    },
  ],
  exports: [PassportModule],
})
export class AuthzModule {}
