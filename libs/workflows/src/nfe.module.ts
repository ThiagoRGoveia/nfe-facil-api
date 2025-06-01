import { Module } from '@nestjs/common';
import { NfeTextWorkflow } from './nfe/nfse-text.workflow';
import { TogetherClient } from './clients/together-client';

@Module({
  providers: [TogetherClient, NfeTextWorkflow],
  exports: [NfeTextWorkflow],
})
export class NfeModule {}
