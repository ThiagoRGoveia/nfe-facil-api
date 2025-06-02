import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OutputConsolidationJobService } from './core/output-consolidation-job.service';
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
  providers: [OutputConsolidationJobService],
})
export class AppModule {}
