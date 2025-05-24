import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient as AwsSqsClient, SendMessageCommand, SQSClientConfig } from '@aws-sdk/client-sqs';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { FifoOptions } from '../ports/queue.port';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
@Injectable()
export class SQSClient {
  private readonly sqsClient: AwsSqsClient;

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const region = this.configService.get<string>('AWS_REGION_ENV');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID_ENV');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY_ENV');
    const proxyUrl = this.configService.get<string>('PROXY_URL');
    const proxyPort = this.configService.get<string>('PROXY_PORT');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS SQS credentials are not set');
    }

    const clientConfig: SQSClientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    // Add proxy configuration if proxy URL is provided
    if (proxyUrl && nodeEnv !== 'local') {
      const proxyAgent = new HttpsProxyAgent(`http://${proxyUrl}:${proxyPort}`);
      clientConfig.requestHandler = new NodeHttpHandler({
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent,
      });
    }

    this.sqsClient = new AwsSqsClient(clientConfig);
  }

  async sendMessage(queueUrl: string, messageBody: string, options?: FifoOptions): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: options?.fifo ? options.groupId : undefined,
      MessageDeduplicationId: options?.fifo ? new UuidAdapter().generate() : undefined,
    });

    await this.sqsClient.send(command);
  }
}
