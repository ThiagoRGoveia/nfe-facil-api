import { Module } from '@nestjs/common';
import { PublicController } from './controllers/public.controller';
import { PublicService } from './services/public.service';
import { SESClient } from '../../infra/aws/ses/ses.client';

@Module({
  controllers: [PublicController],
  providers: [PublicService, SESClient],
  exports: [PublicService],
})
export class PublicModule {}
