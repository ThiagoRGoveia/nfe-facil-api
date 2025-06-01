import { Module } from '@nestjs/common';
import { ExcelPort } from './core/ports/excel.port';
import { ExcelJsAdapter } from './core/adapters/excel.adapter';

@Module({
  providers: [
    {
      provide: ExcelPort,
      useClass: ExcelJsAdapter,
    },
  ],
  exports: [ExcelPort],
})
export class ExcelLibModule {}
