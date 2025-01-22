## Factories

### Description and Applicability

Factories are utility classes used to create test instances of domain entities and DTOs. They leverage MikroORM's Factory and Seeder system to provide consistent test data generation and database seeding capabilities.

### Code Rules

1. Factories should be placed in the `infra/tests/factories` directory
2. File naming convention: `{entity-name}.factory.ts`
3. Class naming convention: PascalCase with Factory suffix (e.g., `ThreadFactory`)
4. Should extend MikroORM's `Factory<T>` class
5. Should provide both in-memory and database creation methods
6. Should use faker for generating random data
7. Should be used only in test files
8. Should provide helper functions for common use cases

### Examples

```typescript
import { Thread, ThreadType } from '@/core/user-messages/domain/entities/thread.entity';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';

export class ThreadFactory extends Factory<Thread> {
  model = Thread;

  definition(): Partial<Thread> {
    return {
      name: faker.lorem.words(3),
      type: faker.helpers.arrayElement(Object.values(ThreadType)),
      foreignKey: faker.string.uuid(),
    };
  }
}

// Helper for in-memory entity creation
export function useThreadFactory(data: Partial<RequiredEntityData<Thread>>, em: EntityManager): Thread {
  return new ThreadFactory(em).makeOne(data);
}

// Helper for database entity creation
export async function useDbThread(data: Partial<RequiredEntityData<Thread>>, em: EntityManager): Promise<Thread> {
  const entity = useThreadFactory(data, em);
  await em.persistAndFlush(entity);
  return entity;
}
```

### Usage Examples

```typescript
describe('Thread Tests', () => {
  let em: EntityManager;

  it('should create in-memory thread', () => {
    const thread = useThreadFactory({ name: 'Custom Thread' }, em);
    expect(thread.name).toBe('Custom Thread');
  });

  it('should create database thread', async () => {
    const thread = await useDbThread(
      {
        type: ThreadType.SHIPMENT,
      },
      em,
    );
    expect(thread.id).toBeDefined();
  });
});
```

### Key Features

1. **Factory Definition**

   - Extends MikroORM's Factory class
   - Specifies model type
   - Provides default values via definition method

2. **Helper Functions**

   - `useThreadFactory` - Creates in-memory instances
   - `useDbThread` - Creates and persists to database
   - Both support partial data overrides

3. **Data Generation**
   - Uses faker for realistic test data
   - Handles enums and complex types
   - Maintains type safety

### Libraries Used

- @mikro-orm/core - For entity management
- @mikro-orm/seeder - For factory system
- @faker-js/faker - For generating test data

### Best Practices

1. Always provide type-safe factory methods
2. Use helper functions for common creation patterns
3. Allow partial data overrides for flexibility
4. Maintain realistic default values
5. Consider relationships when creating entities
6. Use enum values for type-specific fields
7. Separate in-memory and database creation concerns
