import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ContactFormController } from './controllers/contact-form.controller';
import { ContactFormService } from './services/contact-form.service';
import { SESClient } from '../../infra/aws/ses/ses.client';

@Module({
  imports: [ConfigModule, LoggerModule],
  controllers: [ContactFormController],
  providers: [ContactFormService, SESClient],
})
export class ContactFormModule {}
