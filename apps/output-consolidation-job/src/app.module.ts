import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OutputConsolidationJobService } from './core/output-consolidation-job.service';
import { baseImports } from 'apps/api/base-module-imports';
import { FeatureModule } from '@/core/feature.module';
import { ToolingModule } from '@/infra/tooling.module';

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
  providers: [OutputConsolidationJobService],
})
export class AppModule {}
