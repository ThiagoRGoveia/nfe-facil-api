import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { BaseIntegrationTestModule } from './base-integration-test.module';
import { User } from '@/core/users/domain/entities/user.entity';
import { GraphqlExpressContext } from '../graphql/types/context.type';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';

export function useGraphqlModule(user: () => User) {
  @Module({
    imports: [
      BaseIntegrationTestModule,
      GraphQLModule.forRoot<YogaDriverConfig>({
        driver: YogaDriver,
        introspection: true,
        autoSchemaFile: join(process.cwd(), 'test/setup/integration/test-schema.gql'),
        debug: true,
        context: ({ req }: GraphqlExpressContext) => {
          req.user = user(); // Attach user to request context
          return { req };
        },
      }),
    ],
    providers: [],
    exports: [GraphQLModule],
  })
  class GraphQLIntegrationTestModule {}

  return GraphQLIntegrationTestModule;
}
