import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '../../tests/base-integration-test.module';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../public.decorator';
import request from 'supertest';
import { APP_GUARD } from '@nestjs/core';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useDbDrop, useDbSchema } from '../../tests/db-schema.seed';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { UsersModule } from '@/core/users/users.module';
import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

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

  @Roles([UserRole.ADMIN])
  @Get('admin')
  adminOnly() {
    return { message: 'admin route' };
  }

  @Roles([UserRole.CUSTOMER])
  @Get('customer')
  customerOnly() {
    return { message: 'customer route' };
  }

  @Roles([UserRole.ADMIN, UserRole.CUSTOMER])
  @Get('both')
  bothRoles() {
    return { message: 'both roles route' };
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

  @Roles([UserRole.ADMIN])
  @Query(() => TestResponse)
  adminOnly() {
    return { message: 'admin query' };
  }

  @Roles([UserRole.CUSTOMER])
  @Query(() => TestResponse)
  customerOnly() {
    return { message: 'customer query' };
  }

  @Roles([UserRole.ADMIN, UserRole.CUSTOMER])
  @Query(() => TestResponse)
  bothRoles() {
    return { message: 'both roles query' };
  }
}

let currentUser: User | null = null;

@Injectable()
class TestAuthMiddleware implements NestMiddleware {
  use(req: Request & { user?: User }, _res: Response, next: NextFunction) {
    // For both HTTP and GraphQL requests, we set the user on the request object
    req.user = currentUser || undefined;
    next();
  }
}

describe('RolesGuard (integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let orm: MikroORM;

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
        TestResolver,
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();

    // Apply the middleware globally
    app.use(new TestAuthMiddleware().use.bind(new TestAuthMiddleware()));

    em = module.get<EntityManager>(EntityManager);
    orm = module.get<MikroORM>(MikroORM);
    await app.init();
  });

  afterEach(async () => {
    currentUser = null;

    await app.close();
  });

  describe('REST endpoints', () => {
    let adminUser: User;
    let customerUser: User;

    beforeEach(async () => {
      adminUser = await useDbUser(
        {
          clientId: 'admin-key',
          clientSecret: 'admin-secret',
          role: UserRole.ADMIN,
        },
        em,
      );

      customerUser = await useDbUser(
        {
          clientId: 'customer-key',
          clientSecret: 'customer-secret',
          role: UserRole.CUSTOMER,
        },
        em,
      );
    });

    it('should allow access to public routes without user', async () => {
      currentUser = null;
      await request(app.getHttpServer()).get('/test/public').expect(200).expect({ message: 'public route' });
    });

    it('should allow access to undecorated routes without user', async () => {
      currentUser = null;
      await request(app.getHttpServer()).get('/test/protected').expect(200).expect({ message: 'protected route' });
    });

    it('should deny access to admin route for customer', async () => {
      currentUser = customerUser;
      await request(app.getHttpServer()).get('/test/admin').expect(403);
    });

    it('should allow access to admin route for admin', async () => {
      currentUser = adminUser;
      await request(app.getHttpServer()).get('/test/admin').expect(200).expect({ message: 'admin route' });
    });

    it('should allow access to routes with multiple roles for any matching role', async () => {
      currentUser = customerUser;
      await request(app.getHttpServer()).get('/test/both').expect(200).expect({ message: 'both roles route' });
    });
  });

  describe('GraphQL endpoints', () => {
    let adminUser: User;
    let customerUser: User;

    beforeEach(async () => {
      adminUser = await useDbUser(
        {
          clientId: 'admin-key',
          clientSecret: 'admin-secret',
          role: UserRole.ADMIN,
        },
        em,
      );

      customerUser = await useDbUser(
        {
          clientId: 'customer-key',
          clientSecret: 'customer-secret',
          role: UserRole.CUSTOMER,
        },
        em,
      );
    });

    const adminQuery = `
      query {
        adminOnly {
          message
        }
      }
    `;

    const bothRolesQuery = `
      query {
        bothRoles {
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

    it('should allow access to public queries without user', async () => {
      currentUser = null;
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: publicQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.public.message).toBe('public query');
        });
    });

    it('should deny access to admin query for customer', async () => {
      currentUser = customerUser;
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: adminQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.data).toBeNull();
        });
    });

    it('should allow access to admin query for admin', async () => {
      currentUser = adminUser;
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: adminQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.adminOnly.message).toBe('admin query');
        });
    });

    it('should allow access to queries with multiple roles for any matching role', async () => {
      currentUser = customerUser;
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: bothRolesQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.bothRoles.message).toBe('both roles query');
        });
    });
  });
});
