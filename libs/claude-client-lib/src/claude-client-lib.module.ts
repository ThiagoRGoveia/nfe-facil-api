import { Module } from '@nestjs/common';
import { ClaudeClientLibService } from './claude-client-lib.service';

@Module({
  providers: [ClaudeClientLibService],
  exports: [ClaudeClientLibService],
})
export class ClaudeClientLibModule {}
