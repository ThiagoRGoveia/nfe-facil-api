import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '../tests/base-integration-test.module';
import { JwtAuthGuard } from './jwt.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from './public.decorator';
import * as request from 'supertest';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '@/core/users/users.module';
import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { UserDbPort } from '@/core/users/application/ports/users-db.port';
import { CreateUserSocialUseCase } from '@/core/users/application/use-cases/create-user-social.use-case';
import { User } from '@/core/users/domain/entities/user.entity';
import { createMock } from '@golevelup/ts-jest';
import { UserMikroOrmDbRepository } from '@/core/users/infra/persistence/db/orm/users-mikro-orm-db.repository';
import { useDbRefresh, useDbSchema } from '../tests/db-schema.seed';
import { MikroORM } from '@mikro-orm/core';
import { Auth0Client } from './auth0.client';

jest.setTimeout(100000);

@ObjectType()
class TestResponse {
  @Field()
  message: string;
}

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

@Resolver()
@UseGuards(JwtAuthGuard)
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

describe('JwtAuthGuard (integration)', () => {
  let app: INestApplication;
  let guard: JwtAuthGuard;
  let userDbPort: jest.Mocked<UserDbPort>;
  let createUserSocial: jest.Mocked<CreateUserSocialUseCase>;
  let orm: MikroORM;

  beforeEach(async () => {
    userDbPort = createMock<UserDbPort>();
    createUserSocial = createMock<CreateUserSocialUseCase>();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BaseIntegrationTestModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        UsersModule,
        GraphQLModule.forRoot<YogaDriverConfig>({
          driver: YogaDriver,
          autoSchemaFile: true,
        }),
      ],
      controllers: [TestController],
      providers: [
        JwtStrategy,
        TestResolver,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();
    orm = module.get<MikroORM>(MikroORM);
    app = module.createNestApplication();
    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    await useDbSchema(orm);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await useDbRefresh(orm);
  });

  describe('REST endpoints', () => {
    it('should allow access to public routes without token', async () => {
      await request(app.getHttpServer()).get('/test/public').expect(200).expect({ message: 'public route' });
    });

    it('should block access to protected to any protected rest', async () => {
      await request(app.getHttpServer()).get('/test/protected').expect(403);
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

    // NOTICE: Used to test the JWT guard with a valid token DO NOT REMOVE
    // it('should allow access to protected routes with valid token for existing user', async () => {
    //   const token =
    //     'TOKEN';
    //   // const mockUser = { id: 1, name: 'Test User' } as User;

    //   jest.spyOn(guard, 'parentCanActivate').mockResolvedValueOnce(true);
    //   // userDbPort.findByClientId.mockResolvedValueOnce(mockUser);

    //   await request(app.getHttpServer())
    //     .post('/graphql')
    //     .send({ query: protectedQuery })
    //     .set('Authorization', `Bearer ${token}`)
    //     .expect(200)
    //     .expect((res) => {
    //       expect(res.body.data.protected.message).toBe('protected query');
    //     });
    // });
  });
});
