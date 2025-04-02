import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { SESClient } from '../../../infra/aws/ses/ses.client';
import { ContactFormDto } from '../dto/contact-form.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly sesClient: SESClient,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('PublicService');
  }

  async processContactForm(contactFormData: ContactFormDto): Promise<void> {
    try {
      const contactEmail = this.configService.get<string>('CONTACT_EMAIL');

      if (!contactEmail) {
        throw new Error('CONTACT_EMAIL environment variable is not set');
      }

      const subject = 'Contato Nfe-Facil';

      const htmlBody = `
        <h1>Novo contato via formulário do site</h1>
        <p><strong>Nome:</strong> ${contactFormData.name}</p>
        <p><strong>Email:</strong> ${contactFormData.email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${contactFormData.message}</p>
      `;

      const textBody = `
        Novo contato via formulário do site
        
        Nome: ${contactFormData.name}
        Email: ${contactFormData.email}
        
        Mensagem:
        ${contactFormData.message}
      `;

      await this.sesClient.sendEmail(
        contactEmail,
        contactEmail, // Using same email as from and to
        subject,
        htmlBody,
        textBody,
      );

      this.logger.info(`Contact form submitted by ${contactFormData.email}`);
    } catch (error) {
      this.logger.error(`Error processing contact form: ${error.message}`, error.stack);
      throw error;
    }
  }
}
