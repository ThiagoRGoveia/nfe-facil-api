## Resolvers

### Description and Applicability

Resolvers are classes that handle GraphQL operations (queries, mutations, and field resolvers). They act as the entry point for GraphQL requests and delegate the business logic to use cases. Field resolvers handle computed or lazy-loaded fields.

### Code Rules

1. Resolvers should be placed in the `presenters/graphql/resolvers` directory
2. File naming convention: `{feature-name}.resolver.ts`
3. Class naming convention: PascalCase with Resolver suffix (e.g., `ThreadsResolver`)
4. Must use @Resolver() decorator with the entity type
5. Should use @Query(), @Mutation(), and @ResolveField() decorators
6. Should delegate business logic to use cases
7. Should handle GraphQL-specific concerns (args, context, etc.)
8. Should include proper return types and input validations
9. If necessary the request user can be loaded from the context

### Examples

#### Basic Query and Mutation Operations

```typescript
@Resolver(() => Thread)
export class ThreadsResolver {
  constructor(private readonly createThreadUseCase: CreateThreadUseCase, private readonly threadDbPort: ThreadDbPort) {}

  @Query(() => Thread, { nullable: true })
  async findThreadById(@Args('id', { type: () => Int }) id: number): Promise<Thread | null> {
    return await this.threadDbPort.findById(id);
  }

  @Mutation(() => Thread)
  async createThread(@Args('input') input: ThreadDto, @Context() context: GraphqlExpressContext): Promise<Thread> {
    return await this.createThreadUseCase.execute({
      data: input,
      user: context.req.user,
    });
  }
}
```

#### Field Resolvers

```typescript
@Resolver(() => Thread)
export class ThreadsResolver {
  constructor(private readonly threadDbPort: ThreadDbPort) {}

  @ResolveField('readStatus', () => ReadStatus)
  async readStatus(@Parent() thread: Thread, @Context() context: GraphqlExpressContext) {
    const interests = await thread.userInterests.load({
      where: { user: context.req.user },
    });
    return interests.length === 0 ? ReadStatus.UNREAD : interests[0].readStatus;
  }

  @ResolveField('users', () => [User])
  async users(@Parent() thread: Thread) {
    return thread.users.load();
  }

  @ResolveField('paginatedMessages', () => FindAllMessagesResponseDto)
  async paginatedMessages(
    @Parent() thread: Thread,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ) {
    return this.threadMessageDbPort.findAllByThreadId(thread.id, pagination, sort);
  }
}
```

### Field Resolver Types

1. **Computed Fields**

   - Calculate values based on other fields
   - Example: `readStatus` field that computes based on user interests

2. **Relationship Loading**

   - Lazy load related entities
   - Example: `users` field that loads the related users collection

3. **Paginated Relations**
   - Handle paginated loading of related entities
   - Example: `paginatedMessages` field with pagination and sorting

### Decorator Usage

1. **Operation Decorators**

   ```typescript
   @Query(() => ReturnType)
   @Mutation(() => ReturnType)
   ```

2. **Field Resolver Decorator**

   ```typescript
   @ResolveField('fieldName', () => ReturnType)
   ```

3. **Parameter Decorators**
   ```typescript
   @Args('name', { type: () => Type })
   @Parent()
   @Context()
   ```

### Best Practices

1. **Field Resolution**

   - Always use field resolvers for computed properties
   - Implement lazy loading and field resolvers for relationships
   - Handle N+1 query problems using DataLoader
   - Provide pagination for large collections

2. **Context Usage**

   - Access user information from context
   - Handle authentication in resolvers
   - Pass necessary context to use cases

3. **Error Handling**

   - Use proper GraphQL error types
   - Handle business logic errors appropriately
   - Provide meaningful error messages

4. **Performance**
   - Implement field resolvers for expensive operations
   - Use pagination for large collections
   - Optimize relationship loading

### Libraries Used

- @nestjs/graphql - For GraphQL functionality
- class-validator - For input validation
