import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestTypeGuard } from '../request-type.guard';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../public.decorator';
import request from 'supertest';
import { ApiKeyStrategy } from '../api-key.strategy';
import { JwtStrategy } from '../jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { JwtAuthGuard } from '../jwt.guard';
import { ApiKeyAuthGuard } from '../api-key.guard';
import { BaseIntegrationTestModule } from '@dev-modules/dev-modules/tests/base-integration-test.module';
import { UsersModule } from '@lib/users';
import { useDbUser } from '@lib/users/core/infra/tests/factories/users.factory';

jest.setTimeout(10000);

@ObjectType()
class TestResponse {
  @Field()
  message: string;
}

@Controller('test')
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

@Resolver()
class TestResolver {
  @Query(() => TestResponse)
  protected() {
    return { message: 'protected query' };
  }

  @Public()
  @Query(() => TestResponse)
  public() {
    return { message: 'public query' };
  }
}

describe('RequestTypeGuard (integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BaseIntegrationTestModule,
        UsersModule,
        GraphQLModule.forRoot<YogaDriverConfig>({
          driver: YogaDriver,
          autoSchemaFile: true,
        }),
      ],
      controllers: [TestController],
      providers: [
        JwtAuthGuard,
        ApiKeyAuthGuard,
        TestResolver,
        ApiKeyStrategy,
        JwtStrategy,
        {
          provide: APP_GUARD,
          useClass: RequestTypeGuard,
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

  describe('REST endpoints', () => {
    it('should allow access to public routes without credentials', async () => {
      await request(app.getHttpServer()).get('/test/public').expect(200).expect({ message: 'public route' });
    });

    it('should block access to protected routes without credentials', async () => {
      await request(app.getHttpServer()).get('/test/protected').expect(401);
    });

    it('should allow access to protected routes with valid API key', async () => {
      const credentials = Buffer.from('test-key:test-secret').toString('base64');

      await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Basic ${credentials}`)
        .expect(200)
        .expect({ message: 'protected route' });
    });

    it('should block access with invalid API key', async () => {
      const credentials = Buffer.from('test-key:wrong-secret').toString('base64');

      await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Basic ${credentials}`)
        .expect(401);
    });

    it('should block access with JWT token on REST endpoint', async () => {
      await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'Bearer some.jwt.token')
        .expect(401);
    });
  });

  describe('GraphQL endpoints', () => {
    const protectedQuery = `
      query {
        protected {
          message
        }
      }
    `;

    const publicQuery = `
      query {
        public {
          message
        }
      }
    `;

    it('should allow access to public queries without JWT', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: publicQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.public.message).toBe('public query');
        });
    });

    it('should block access to protected queries without JWT', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: protectedQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.data).toBeNull();
        });
    });

    it('should block access to protected queries with API key instead of JWT', async () => {
      const credentials = Buffer.from('test-key:test-secret').toString('base64');

      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Basic ${credentials}`)
        .send({ query: protectedQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.data).toBeNull();
        });
    });

    // NOTICE: to test integration with auth0, uncomment the following test and replace the JWT token with a valid one
    // it('should allow access to protected queries with valid JWT', async () => {
    //   await request(app.getHttpServer())
    //     .post('/graphql')
    //     .send({ query: protectedQuery })
    //     .set(
    //       'Authorization',
    //       'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZtb3Y5TE1qRUdjRE5FQk1xeXgzMiJ9.eyJpc3MiOiJodHRwczovL2Rldi1mYTZ1ejIxcHY0MWpoam42LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDEwMjQ2MDczNjYwODYzNjA0NjM3MCIsImF1ZCI6WyJDMkZRWjI1M1lXOVBaMjVIQkdMVloyNU9BVzkzIiwiaHR0cHM6Ly9kZXYtZmE2dXoyMXB2NDFqaGpuNi51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzM5ODg4MDgyLCJleHAiOjE3Mzk5NzQ0ODIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhenAiOiJ2MnZGMlh3bFJaaUE0SjhnMWFMUmxWenpuWXhHYmJ0WiJ9.UetC-_cSiZbMvU_xLbRqo5xc_7dFen2lcG6CzRCochsGXLBkxg-C-ibUn1aZMNOTPJKePNPf3cjbuCeZ3I51kd_GM4lNIo_XX6NbofCjcJMbFSc9EoTpkgbApp-DXWz-Mon6y80f_TZqkMiyhoILtNFtyfTnxAbeEHBhZOjdZ-IFiy2AfUpdHpEHOgIM7JoMqaWs8Uc33IMNOgtNxomk4oR4lTx5667O041wCzKSnWN1Ycae6d5NiD4KCTxQkN_TxfXmID10Iu3ngMjDqZ-I7-eBxpsX19z6KKfeh2st7DBE7PEhpzNhX5oJdeVURSxAlnoxnK0ddZvIQ972_P4AlA',
    //     )
    //     .expect(200)
    //     .expect((res) => {
    //       expect(res.body.data.protected.message).toBe('protected query');
    //     });
    // });
  });
});
