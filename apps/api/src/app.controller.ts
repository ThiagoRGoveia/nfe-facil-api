import { Controller, Get } from '@nestjs/common';
import { Public } from './infra/auth/public.decorator';

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
