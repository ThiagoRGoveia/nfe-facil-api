import { Module } from '@nestjs/common';
import { ZipLibService } from './zip-lib.service';

@Module({
  providers: [ZipLibService],
  exports: [ZipLibService],
})
export class ZipLibModule {}
