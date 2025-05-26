import { Injectable } from '@nestjs/common';
import { WebhookDelivery } from '../../../../api/src/core/webhooks/domain/entities/webhook-delivery.entity';
import {
  HttpClientPort,
  HttpRequestConfig,
} from '../../../../api/src/core/webhooks/application/ports/http-client.port';
import { Webhook, WebhookAuthType } from '../../../../api/src/core/webhooks/domain/entities/webhook.entity';
import { BasicAuthConfig, OAuth2Config } from '../../../../api/src/core/webhooks/application/ports/http-client.port';
import { EncryptionPort } from '@/infra/encryption/ports/encryption.port';

@Injectable()
export class WebhookDispatcherService {
  constructor(
    private readonly httpClient: HttpClientPort,
    private readonly encryptionPort: EncryptionPort,
  ) {}

  async dispatch(delivery: WebhookDelivery): Promise<void> {
    const webhook = await delivery.webhook.load();
    if (!webhook) {
      throw new Error(`Webhook not found for delivery ${delivery.id}`);
    }

    const config: HttpRequestConfig = {
      method: 'POST',
      url: webhook.url,
      headers: {
        ...webhook.headers,
        'Content-Type': 'application/json',
      },
      body: delivery.payload,
      timeout: webhook.timeout,
      auth: this.getAuthConfig(webhook),
    };

    const response = await this.httpClient.request(config);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    }
  }

  private getAuthConfig(webhook: Webhook): BasicAuthConfig | OAuth2Config | undefined {
    if (webhook.authType === WebhookAuthType.NONE) return undefined;

    if (!webhook.encryptedConfig) {
      return undefined;
    }

    const decryptedConfig = this.encryptionPort.decrypt(webhook.encryptedConfig);

    const config = JSON.parse(decryptedConfig) as BasicAuthConfig | OAuth2Config;

    if (this.isBasicAuthConfig(config)) {
      return {
        type: 'basic',
        username: config.username,
        password: config.password,
      };
    } else if (this.isOAuth2Config(config)) {
      return {
        type: 'oauth2',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        tokenUrl: config.tokenUrl,
      };
    }
  }

  private isBasicAuthConfig(config: BasicAuthConfig | OAuth2Config): config is BasicAuthConfig {
    return 'username' in config && 'password' in config;
  }

  private isOAuth2Config(config: BasicAuthConfig | OAuth2Config): config is OAuth2Config {
    return 'clientId' in config && 'clientSecret' in config && 'tokenUrl' in config;
  }
}
