import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreditSpendingJobService } from './core/credit-spending-job.service';
import { FeatureModule } from '@/core/feature.module';
import { ToolingModule } from '@/infra/tooling.module';
import { baseImports } from 'apps/api/base-module-imports';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ToolingModule,
    FeatureModule.register('none'),
    ...baseImports,
  ],
  providers: [CreditSpendingJobService],
})
export class AppModule {}
