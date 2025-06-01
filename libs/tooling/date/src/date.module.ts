import { Module } from '@nestjs/common';
import { DateAdapter, DatePort } from './core/date.adapter';

@Module({
  providers: [
    {
      provide: DatePort,
      useClass: DateAdapter,
    },
  ],
  exports: [DatePort],
})
export class DateModule {}
