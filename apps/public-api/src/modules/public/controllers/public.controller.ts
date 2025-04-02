import { Body, Controller, Post } from '@nestjs/common';
import { PublicService } from '../services/public.service';
import { ContactFormDto } from '../dto/contact-form.dto';
import { Public } from '../../../infra/auth/public.decorator';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Post('contact-form')
  async submitContactForm(@Body() contactFormDto: ContactFormDto): Promise<{ success: boolean }> {
    await this.publicService.processContactForm(contactFormDto);
    return { success: true };
  }
}
