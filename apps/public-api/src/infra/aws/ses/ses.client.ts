import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient as AwsSesClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class SESClient {
  private readonly sesClient: AwsSesClient;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION_ENV');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID_ENV');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY_ENV');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS SES credentials are not set');
    }

    this.sesClient = new AwsSesClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async sendEmail(
    toEmail: string,
    fromEmail: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ): Promise<void> {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
          ...(textBody && {
            Text: {
              Charset: 'UTF-8',
              Data: textBody,
            },
          }),
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: fromEmail,
    });

    await this.sesClient.send(command);
  }
}
