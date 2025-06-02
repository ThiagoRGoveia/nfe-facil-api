import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/core';

export const MikroOrmLambdaCompatibilityConfig = {
  provide: SqlEntityManager,
  useFactory: (em: EntityManager) => em,
  inject: [EntityManager],
};
