import { Module } from '@nestjs/common';
import { DateLibService } from './date-lib.service';

@Module({
  providers: [DateLibService],
  exports: [DateLibService],
})
export class DateLibModule {}
