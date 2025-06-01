import { Module } from '@nestjs/common';
import { WebhooksLibService } from './webhooks-lib.service';

@Module({
  providers: [WebhooksLibService],
  exports: [WebhooksLibService],
})
export class WebhooksLibModule {}
