import { Controller, Post, HttpStatus, HttpCode, Headers, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { HandleStripeEventUseCase } from '../../../application/use-cases/handle-stripe-event.use-case';

@ApiTags('user-credits')
@Controller('user-credits')
export class UserCreditController {
  constructor(private readonly handleStripeEventUseCase: HandleStripeEventUseCase) {}

  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid webhook payload' })
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() request: Request) {
    try {
      // Delegate to the handle stripe event use case
      await this.handleStripeEventUseCase.execute({
        payload: request.body,
        signature,
      });

      // Webhook was processed successfully, return a 200 status
      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
