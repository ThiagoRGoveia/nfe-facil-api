import { Module } from '@nestjs/common';
import { UuidLibService } from './uuid-lib.service';

@Module({
  providers: [UuidLibService],
  exports: [UuidLibService],
})
export class UuidLibModule {}
