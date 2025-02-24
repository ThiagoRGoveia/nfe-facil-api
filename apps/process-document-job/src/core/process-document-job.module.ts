import { Module } from '@nestjs/common';
import { ProcessDocumentJobService } from './process-document-job.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ProcessDocumentJobService],
})
export class ProcessDocumentJobModule {}
