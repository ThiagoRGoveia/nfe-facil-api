import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '../tests/base-integration-test.module';
import { JwtAuthGuard } from './jwt.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from './public.decorator';
import * as request from 'supertest';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

async function getValidToken(url: string, clientId: string, clientSecret: string, scope: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: scope,
  });

  const response = await axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data.access_token;
}
jest.setTimeout(10000);
@Controller('test')
@UseGuards(JwtAuthGuard)
class TestController {
  @Get('protected')
  protected() {
    return { message: 'protected route' };
  }

  @Public()
  @Get('public')
  public() {
    return { message: 'public route' };
  }
}

describe('JwtAuthGuard (integration)', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule, PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [TestController],
      providers: [
        JwtStrategy,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();
    app = module.createNestApplication();
    configService = module.get<ConfigService>(ConfigService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow access to public routes without token', async () => {
    await request(app.getHttpServer()).get('/test/public').expect(200).expect({ message: 'public route' });
  });

  it('should block access to protected routes without token', async () => {
    await request(app.getHttpServer()).get('/test/protected').expect(401);
  });

  it('should allow access to protected routes with valid token', async () => {
    const validToken = await getValidToken(
      configService.get('AUTH_URL')!,
      configService.get('AUTH_CLIENT_ID')!,
      configService.get('AUTH_CLIENT_SECRET')!,
      configService.get('AUTH_SCOPE')!,
    );

    await request(app.getHttpServer()).get('/test/protected').set('Authorization', `Bearer ${validToken}`).expect(200);
  });
});
