import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreditSpendingJobService } from './core/credit-spending-job.service';
import { FeatureModule } from '@/core/feature.module';
import { ToolingModule } from '@/infra/tooling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ToolingModule,
    FeatureModule,
  ],
  providers: [CreditSpendingJobService],
})
export class AppModule {}
