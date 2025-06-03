import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';
import { ApiKeyAuthGuard } from './api-key.guard';

@Injectable()
export class RequestTypeGuard implements CanActivate {
  constructor(
    private jwtGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      return this.apiKeyGuard.canActivate(context) as Promise<boolean>;
    } else if (context.getType<'graphql'>() === 'graphql') {
      return this.jwtGuard.canActivate(context) as Promise<boolean>;
    }
    return false;
  }
}
