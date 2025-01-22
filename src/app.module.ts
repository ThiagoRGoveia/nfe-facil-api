import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthzModule } from './infra/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infra/auth/jwt.guard';

@Module({
  imports: [AuthzModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
