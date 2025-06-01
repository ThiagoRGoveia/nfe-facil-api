import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '../../tests/base-integration-test.module';
import { ApiKeyAuthGuard } from '../api-key.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from '../public.decorator';
import request from 'supertest';
import { ApiKeyStrategy } from '../api-key.strategy';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsersModule } from '@/core/users/users.module';

jest.setTimeout(10000);

@Controller('test')
@UseGuards(ApiKeyAuthGuard)
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

describe('ApiKeyAuthGuard (integration)', () => {
  let app: INestApplication;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BaseIntegrationTestModule,
        PassportModule.register({ defaultStrategy: 'api-key' }),
        UsersModule.register('none'),
      ],
      controllers: [TestController],
      providers: [
        ApiKeyStrategy,
        {
          provide: APP_GUARD,
          useClass: ApiKeyAuthGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    em = module.get<EntityManager>(EntityManager);
    await app.init();

    await useDbUser(
      {
        clientId: 'test-key',
        clientSecret: 'test-secret',
      },
      em,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow access to public routes without credentials', async () => {
    await request(app.getHttpServer()).get('/test/public').expect(200).expect({ message: 'public route' });
  });

  it('should block access to protected routes without credentials', async () => {
    await request(app.getHttpServer()).get('/test/protected').expect(401);
  });

  it('should allow access to protected routes with valid credentials', async () => {
    const credentials = Buffer.from('test-key:test-secret').toString('base64');

    await request(app.getHttpServer())
      .get('/test/protected')
      .set('Authorization', `Basic ${credentials}`)
      .expect(200)
      .expect({ message: 'protected route' });
  });

  it('should block access with invalid credentials', async () => {
    const credentials = Buffer.from('test-key:wrong-secret').toString('base64');

    await request(app.getHttpServer()).get('/test/protected').set('Authorization', `Basic ${credentials}`).expect(401);
  });
});
