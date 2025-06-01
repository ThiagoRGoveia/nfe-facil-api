import { Module } from '@nestjs/common';
import { OpenAiClientLibService } from './open-ai-client-lib.service';

@Module({
  providers: [OpenAiClientLibService],
  exports: [OpenAiClientLibService],
})
export class OpenAiClientLibModule {}
