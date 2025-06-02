import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { BaseIntegrationTestModule } from './base-integration-test.module';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { GraphqlExpressContext } from '@lib/commons/graphql/types/context.type';

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
