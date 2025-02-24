import { Module } from '@nestjs/common';
import { ProcessDocumentJobService } from './core/process-document-job.service';

@Module({
  providers: [ProcessDocumentJobService],
})
export class AppModule {}
