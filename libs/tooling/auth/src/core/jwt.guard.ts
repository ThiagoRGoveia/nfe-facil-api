import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { CreateUserSocialUseCase, UserDbPort } from '@lib/users/users.module';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly userDb: UserDbPort,
    private readonly createUserSocial: CreateUserSocialUseCase,
  ) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (context.getType<'graphql'>() !== 'graphql') {
      return false;
    }

    const ctx = GqlExecutionContext.create(context);

    const request = ctx.getContext().req;
    if (!this.hasJwtToken(request)) {
      return false;
    }

    const result = await this.parentCanActivate(context);
    if (!result) {
      return false;
    }

    const user = await this.userDb.findByAuth0Id(request.user.sub);
    if (user) {
      request.user = user;
      return true;
    }

    // Handle social login case
    const socialUser = await this.createUserSocial.execute({
      auth0Id: request.user.sub,
      email: request.user.email,
      name: request.user.name,
    });
    request.user = socialUser;
    return true;
  }

  async parentCanActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  hasJwtToken(request: Request) {
    return request.headers['authorization']?.startsWith('Bearer ');
  }
}
