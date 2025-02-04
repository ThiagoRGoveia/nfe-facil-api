## Ports

### Description and Applicability

Ports define interfaces that abstract external dependencies from the core business logic. They act as contracts between the application layer and infrastructure implementations, following the ports and adapters (hexagonal) architecture.

### Code Rules

1. Ports should be placed in the `application/ports` directory
2. File naming convention: `{feature-name}-db.port.ts` or `{feature-name}.port.ts`
3. Interface naming convention: PascalCase with Port suffix (e.g., `ThreadDbPort`)
4. The port must extend the `BasePort` class returned by the function call `BasePort<Entity>`
5. Should be abstract classes or interfaces
6. Must be decorated with @Injectable() if abstract classes
7. Should define clear method signatures without implementation details
8. Should be injected using dependency injection tokens

### Examples

```typescript
@Injectable()
export abstract class ThreadDbPort extends BasePort<Thread> {
  abstract save(thread: Thread): Promise<void>;
  // create and update are not promises, the data is persisted when the save method is called
  abstract update(thread: Partial<RequiredEntityData<Thread>>): Thread;
  abstract create(thread: RequiredEntityData<Thread>): Thread;
  abstract delete(id: string): Promise<void>;
}
```

### Libraries Used

- @nestjs/common - For dependency injection decorators
