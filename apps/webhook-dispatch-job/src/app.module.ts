import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookDispatchJobService } from './core/services/webhook-dispatch-job.service';
import { baseImports } from 'apps/api/base-module-imports';
import { ToolingModule } from '@/infra/tooling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ToolingModule,
    ...baseImports,
  ],
  providers: [WebhookDispatchJobService],
})
export class AppModule {}
