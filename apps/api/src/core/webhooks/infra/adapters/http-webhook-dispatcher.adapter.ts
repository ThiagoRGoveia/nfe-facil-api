import { Injectable } from '@nestjs/common';
import { WebhookDispatcherPort } from '../../application/ports/webhook-dispatcher.port';
import { WebhookDelivery } from '../../domain/entities/webhook-delivery.entity';
import { HttpClientPort, HttpRequestConfig } from '../../application/ports/http-client.port';
import { Webhook, WebhookAuthType } from '../../domain/entities/webhook.entity';
import { BasicAuthConfig, OAuth2Config } from '../../application/ports/http-client.port';
import { EncryptionPort } from '@/infra/encryption/ports/encryption.port';

@Injectable()
export class HttpWebhookDispatcherAdapter implements WebhookDispatcherPort {
  constructor(
    private readonly httpClient: HttpClientPort,
    private readonly encryptionPort: EncryptionPort,
  ) {}

  async dispatch(delivery: WebhookDelivery): Promise<void> {
    const webhook = delivery.webhook.unwrap();

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
      throw new Error('Webhook missing required authentication configuration');
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

  isBasicAuthConfig(config: BasicAuthConfig | OAuth2Config): config is BasicAuthConfig {
    return 'username' in config && 'password' in config;
  }

  isOAuth2Config(config: BasicAuthConfig | OAuth2Config): config is OAuth2Config {
    return 'clientId' in config && 'clientSecret' in config && 'tokenUrl' in config;
  }
}
