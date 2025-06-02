import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';
import {
  HttpClientPort,
  HttpRequestConfig,
  HttpResponse,
  OAuth2Config,
  BasicAuthConfig,
} from '../../application/ports/http-client.port';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HttpClientAdapter implements HttpClientPort {
  private readonly axiosInstance: AxiosInstance;
  private oAuth2Tokens: Map<string, { token: string; expiresAt: number }>;
  private proxyUrlValue: string;
  private proxyPortValue: string;
  private proxyMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create();
    this.oAuth2Tokens = new Map();
    const proxyUrlValue = this.configService.get('PROXY_URL');
    const proxyPortValue = this.configService.get('PROXY_PORT');
    const proxyMode = this.configService.get('NODE_ENV') !== 'local';
    if (proxyMode && (!proxyUrlValue || !proxyPortValue)) {
      throw new Error('Proxy URL or Proxy Port is required');
    }
    this.proxyUrlValue = proxyUrlValue;
    this.proxyPortValue = proxyPortValue;
    this.proxyMode = proxyMode;
  }

  async request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const axiosConfig: AxiosRequestConfig = {
      method: config.method,
      url: config.url,
      headers: config.headers || {},
      data: config.body,
      timeout: config.timeout || 10000,
      proxy: this.proxyMode
        ? {
            host: this.proxyUrlValue,
            port: Number(this.proxyPortValue),
            protocol: 'http',
          }
        : undefined,
    };

    if (config.auth) {
      await this.applyAuthentication(axiosConfig, config.auth);
    }

    try {
      const response = await this.axiosInstance.request<T>(axiosConfig);

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP request failed: ${error.message}`);
      }
      throw error;
    }
  }

  private async applyAuthentication(
    axiosConfig: AxiosRequestConfig,
    auth: BasicAuthConfig | OAuth2Config,
  ): Promise<void> {
    if (auth.type === 'basic') {
      this.applyBasicAuth(axiosConfig, auth);
    } else if (auth.type === 'oauth2') {
      await this.applyOAuth2Auth(axiosConfig, auth);
    }
  }

  private applyBasicAuth(axiosConfig: AxiosRequestConfig, auth: BasicAuthConfig): void {
    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    axiosConfig.headers = {
      ...axiosConfig.headers,
      Authorization: `Basic ${credentials}`,
    };
  }

  private async applyOAuth2Auth(axiosConfig: AxiosRequestConfig, auth: OAuth2Config): Promise<void> {
    const token = await this.getOAuth2Token(auth);
    axiosConfig.headers = {
      ...axiosConfig.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  private async getOAuth2Token(auth: OAuth2Config): Promise<string> {
    const cacheKey = `${auth.clientId}:${auth.tokenUrl}`;
    const cached = this.oAuth2Tokens.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const tokenResponse = await this.axiosInstance.post(
      auth.tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, expires_in } = tokenResponse.data;

    this.oAuth2Tokens.set(cacheKey, {
      token: access_token,
      expiresAt: Date.now() + expires_in * 1000 - 60000, // Subtract 1 minute for safety
    });

    return access_token;
  }
}
