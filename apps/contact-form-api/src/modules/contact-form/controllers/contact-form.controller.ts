import { Body, Controller, Post } from '@nestjs/common';
import { ContactFormService } from '../services/contact-form.service';
import { ContactFormDto } from '../dto/contact-form.dto';

@Controller()
export class ContactFormController {
  constructor(private readonly contactFormService: ContactFormService) {}

  @Post('contact-form')
  async submitContactForm(@Body() contactFormDto: ContactFormDto): Promise<{ success: boolean }> {
    await this.contactFormService.processContactForm(contactFormDto);
    return { success: true };
  }
}
