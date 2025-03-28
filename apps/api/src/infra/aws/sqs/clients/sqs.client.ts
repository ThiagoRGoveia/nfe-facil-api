import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient as AwsSqsClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SQSClient {
  private readonly sqsClient: AwsSqsClient;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION_ENV');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID_ENV');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY_ENV');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS SQS credentials are not set');
    }

    this.sqsClient = new AwsSqsClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async sendMessage(queueUrl: string, messageBody: string): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
    });

    await this.sqsClient.send(command);
  }
}
