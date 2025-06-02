import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BaseIntegrationTestModule } from './base-integration-test.module';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { RequestHandler } from 'express';

export function useRestModule(user: () => User) {
  @Module({
    imports: [BaseIntegrationTestModule],
    providers: [],
    exports: [],
  })
  class RestIntegrationTestModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
      const middleware: RequestHandler = (req, _res, next) => {
        req.user = user(); // Attach user to request object
        next();
      };

      consumer.apply(middleware).forRoutes('*');
    }
  }

  return RestIntegrationTestModule;
}
