## Repositories

### Description and Applicability

Repositories are classes that implement the persistence ports and handle the storage and retrieval of domain entities. They abstract the underlying database implementation and provide a collection-like interface to access domain objects.

### Code Rules

1. Repositories should be placed in the `infra/persistence/db/orm` directory
2. File naming convention: `{entity-name}-{orm-name}-db.repository.ts`
3. Class naming convention: PascalCase with Repository suffix (e.g., `ThreadMikroOrmRepository`)
4. The repository must extend the `BaseRepository` class returned by the function call `EntityRepository(Entity)`
5. Must implement a corresponding Port interface
6. Should handle all database operations
7. Should include mapping between ORM entities and domain entities
8. Should handle database-specific error handling
9. Should be decorated with @Injectable()

### Examples

```typescript
@Injectable()
export class ThreadMikroOrmRepository extends EntityRepository(Thread) implements ThreadDbPort {
  constructor(
    @InjectRepository(ThreadEntity)
    private readonly repository: EntityRepository<ThreadEntity>,
  ) {}

  async findById(id: string): Promise<Thread> {
    const threadEntity = await this.repository.findOne({ id });
    if (!threadEntity) {
      throw new ThreadNotFoundError(id);
    }
    return this.mapToDomain(threadEntity);
  }

  private mapToDomain(entity: ThreadEntity): Thread {
    return Thread.create({
      id: entity.id,
      title: entity.title,
      participants: entity.participants.map(this.mapParticipantToDomain),
      messages: entity.messages.map(this.mapMessageToDomain),
    });
  }
}
```

### Libraries Used

- @mikro-orm/core - For ORM functionality
- @nestjs/common - For dependency injection
