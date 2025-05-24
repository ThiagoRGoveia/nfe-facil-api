import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const nodeEnv = configService.get('NODE_ENV');
    const AUTH_DOMAIN = configService.get('AUTH_DOMAIN');
    const AUTH_ISSUER_URL = configService.get('AUTH_ISSUER_URL');
    const AUTH_AUDIENCE = configService.get('AUTH_AUDIENCE');
    const PROXY_URL = configService.get('PROXY_URL');
    const PROXY_PORT = configService.get('PROXY_PORT');
    const proxyMode = nodeEnv !== 'local';
    if (!AUTH_DOMAIN || !AUTH_ISSUER_URL || !AUTH_AUDIENCE) {
      throw new Error('AUTH_DOMAIN or AUTH_ISSUER_URL or AUTH_AUDIENCE is not set');
    }

    if (proxyMode && (!PROXY_URL || !PROXY_PORT)) {
      throw new Error('PROXY_URL or PROXY_PORT is not set');
    }

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${AUTH_DOMAIN}/.well-known/jwks.json`,
        requestAgent: nodeEnv !== 'local' ? new HttpsProxyAgent(`http://${PROXY_URL}:${PROXY_PORT}`) : undefined,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: AUTH_ISSUER_URL,
      algorithms: ['RS256'],
      audience: AUTH_AUDIENCE,
    });
  }

  validate(payload: unknown): unknown {
    return payload;
  }
}
