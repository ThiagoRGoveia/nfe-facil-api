export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type BasicAuthConfig = {
  type: 'basic';
  username: string;
  password: string;
};

export type OAuth2Config = {
  type: 'oauth2';
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
};

export type AuthConfig = BasicAuthConfig | OAuth2Config;

export interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: AuthConfig;
  timeout?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export abstract class HttpClientPort {
  abstract request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}
