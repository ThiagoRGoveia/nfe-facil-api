import { Module } from '@nestjs/common';
import { QueueLibService } from './queue-lib.service';

@Module({
  providers: [QueueLibService],
  exports: [QueueLibService],
})
export class QueueLibModule {}
