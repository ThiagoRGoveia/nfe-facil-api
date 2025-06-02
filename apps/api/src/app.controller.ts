import { Controller, Get } from '@nestjs/common';
import { Public } from '@lib/auth/core/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
    };
  }
}
