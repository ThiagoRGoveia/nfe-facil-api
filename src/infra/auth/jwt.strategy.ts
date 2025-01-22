import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const AUTH_DOMAIN = configService.get('AUTH_DOMAIN');
    const AUTH_AUDIENCE = configService.get('AUTH_AUDIENCE');
    const AUTH_ISSUER_URL = configService.get('AUTH_ISSUER_URL');

    if (!AUTH_DOMAIN || !AUTH_AUDIENCE || !AUTH_ISSUER_URL) {
      throw new Error('AUTH_DOMAIN or AUTH_AUDIENCE or AUTH_ISSUER_URL is not set');
    }

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${AUTH_DOMAIN}/.well-known/jwks.json`,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: AUTH_ISSUER_URL,
      algorithms: ['RS256'],
    });
  }

  validate(payload: unknown): unknown {
    return payload;
  }
}
