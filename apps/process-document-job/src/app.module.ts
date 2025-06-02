import { Module } from '@nestjs/common';
import { ProcessDocumentJobService } from './core/process-document-job.service';
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
    FeatureModule,
  ],
  providers: [ProcessDocumentJobService],
})
export class AppModule {}
