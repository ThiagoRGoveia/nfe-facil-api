import { Module } from '@nestjs/common';
import { HttpClientLibService } from './http-client-lib.service';

@Module({
  providers: [HttpClientLibService],
  exports: [HttpClientLibService],
})
export class HttpClientLibModule {}
