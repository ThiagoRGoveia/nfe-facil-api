import { Controller, Post, Headers, RawBodyRequest, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { HandleStripeEventUseCase, StripeEventDto } from '../../../application/use-cases/handle-stripe-event.use-case';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Public } from '@/infra/auth/public.decorator';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  private readonly stripeWebhookSecret: string;

  constructor(
    private readonly handleStripeEventUseCase: HandleStripeEventUseCase,
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    const stripeWebhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!stripeWebhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
    this.stripeWebhookSecret = stripeWebhookSecret;
  }

  /**
   * Handles Stripe webhook events
   * - Authenticates the request using the Stripe signature
   * - The rawBody is needed to verify the signature
   * - The endpoint is excluded from Swagger as it's meant for Stripe only
   */
  @Post('webhook')
  @Public()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event processed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid signature or payload' })
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Headers('Authorization') authorization: string,
  ): Promise<{ received: boolean }> {
    this.logger.info('Received Stripe webhook event');

    if (!signature) {
      this.logger.warn('Missing Stripe signature header');
      return { received: false };
    }

    if (!authorization) {
      this.logger.warn('Missing Authorization header');
      return { received: false };
    }

    if (authorization.replace('Basic ', '') !== this.stripeWebhookSecret) {
      this.logger.warn('Invalid Authorization header');
      return { received: false };
    }

    try {
      // We use the raw body to verify the signature
      const rawBody = req.rawBody;

      if (!rawBody) {
        this.logger.warn('Missing raw body in request');
        return { received: false };
      }

      const eventDto: StripeEventDto = {
        payload: rawBody,
        signature,
      };

      const success = await this.handleStripeEventUseCase.execute(eventDto);

      return { received: success };
    } catch (error) {
      this.logger.error(`Error handling Stripe webhook: ${error.message}`, error.stack);

      // Return 200 even for errors to prevent Stripe from retrying
      // Detailed error is logged for investigation
      return { received: false };
    }
  }
}
