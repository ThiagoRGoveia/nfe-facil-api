import { Module } from '@nestjs/common';
import { ProcessDocumentJobService } from './core/process-document-job.service';
import { baseImports } from 'apps/api/base-module-imports';
import { ToolingModule } from '@/infra/tooling.module';
import { FeatureModule } from '@/core/feature.module';
import { ConfigModule } from '@nestjs/config';

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
  providers: [ProcessDocumentJobService],
})
export class AppModule {}
