import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '../../tests/base-integration-test.module';
import { RequestTypeGuard } from '../request-type.guard';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../public.decorator';
import * as request from 'supertest';
import { ApiKeyStrategy } from '../api-key.strategy';
import { JwtStrategy } from '../jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useDbRefresh, useDbSchema } from '../../tests/db-schema.seed';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { UsersModule } from '@/core/users/users.module';
import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { JwtAuthGuard } from '../jwt.guard';
import { ApiKeyAuthGuard } from '../api-key.guard';

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
  let orm: MikroORM;
  let jwtGuard: JwtAuthGuard;

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
    orm = module.get<MikroORM>(MikroORM);
    jwtGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    await app.init();
    await useDbSchema(orm);

    await useDbUser(
      {
        clientId: 'test-key',
        clientSecret: 'test-secret',
      },
      em,
    );
  });

  afterEach(async () => {
    await useDbRefresh(orm);
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

    // TODO implement after auth0 is integrated for user oauth2
    // it('should allow access to protected queries with valid JWT', async () => {
    //   jest.spyOn(jwtGuard, 'parentCanActivate').mockResolvedValue(true);
    //   await request(app.getHttpServer())
    //     .post('/graphql')
    //     .send({ query: protectedQuery })
    //     .set('Authorization', 'Bearer some.jwt.token')
    //     .expect(200)
    //     .expect((res) => {
    //       expect(res.body.data.protected.message).toBe('protected query');
    //     });
    // });
  });
});
