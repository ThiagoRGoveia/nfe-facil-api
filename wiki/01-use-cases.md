## Use Cases

### Description and Applicability

Use Cases represent the application's business logic and orchestrate the flow of data between the domain layer and external interfaces. They implement specific features or user interactions within the system.

### Code Rules

1. Use Cases should be placed in the `application/use-cases` directory
2. File naming convention: `{feature-name}.use-case.ts`
3. Class naming convention: PascalCase with UseCase suffix (e.g., `SendMessageToThreadUseCase`)
4. Must have a single public `execute` method
5. Should receive dependencies through constructor injection
6. Should not contain business rules (these belong in domain entities)
7. Should orchestrate calls between repositories, adapters, domain entities, and external services

### Examples

```typescript
@Injectable()
export class SendMessageToThreadUseCase {
  constructor(
    @Inject(ThreadMessageDbPort)
    private readonly messageRepository: ThreadMessageDbPort,
    @Inject(ThreadDbPort)
    private readonly threadRepository: ThreadDbPort,
  ) {}

  async execute(params: SendMessageParams): Promise<void> {
    // Implementation
  }
}
```

### Libraries Used

- @nestjs/common - For dependency injection and module system
