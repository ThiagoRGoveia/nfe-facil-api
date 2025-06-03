import { WebhookEvent } from '../../domain/entities/webhook.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject } from 'class-validator';
export class NotifyWebhookDto {
  @ApiProperty({
    description: 'The event to notify the webhook about',
    enum: WebhookEvent,
    example: WebhookEvent.DOCUMENT_PROCESSED,
  })
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @ApiProperty({
    description: 'The payload to notify the webhook about',
    type: Object,
    example: { data: 'example' },
  })
  @IsObject()
  payload: object;
}
