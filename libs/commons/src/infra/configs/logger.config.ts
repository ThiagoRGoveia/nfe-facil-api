import { ConfigService } from '@nestjs/config';

export function loggerConfig(configService: ConfigService) {
  return {
    forRoutes: ['*'],
    pinoHttp:
      configService.get('NODE_ENV') !== 'production' && configService.get('NODE_ENV') !== 'uat'
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
              },
            },
          }
        : undefined,
  };
}
