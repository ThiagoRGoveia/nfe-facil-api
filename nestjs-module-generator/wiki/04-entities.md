## Entities

### Description and Applicability

Entities are domain objects that encapsulate business rules and maintain the state of business objects. They represent the core concepts of the domain and contain the business logic that operates on that data. In this project, entities serve multiple purposes:

1. Domain Objects - Representing core business concepts
2. MikroORM Entities - Serving as database models
3. GraphQL Types - Providing API type definitions

This multi-purpose approach is implemented using decorators from both MikroORM and GraphQL, while still maintaining domain logic integrity.

### Code Rules

1. Entities should be placed in the `domain/entities` directory
2. File naming convention: `{entity-name}.entity.ts`
3. Class naming convention: PascalCase (e.g., `Thread`, `ThreadMessage`)
4. Should contain business logic and validation rules
5. Properties should use appropriate decorators for both ORM and GraphQL
6. Should extend BaseEntity for common fields (createdAt, updatedAt)
7. Use TypeScript enums for fixed value sets
8. Implement relationships using MikroORM Collections
9. Use embedded entities for complex property structures
10. Always lazy load relationships in the default definition of the entity.
    10.1 use eager: false for all relationships.
    10.2 use ref: true for all relationships.
11. Use Ref types for relationships that are one to one or many to one.
12. Use Collection types for relationships that are one to many or many to many.
13. Use Embedded types for complex properties that are not entities.
14. Use snake_case for all database column and table names.

### Decorator Usage

1. **MikroORM Decorators**

   - `@Entity()` - Marks class as database entity
   - `@Property()` - Defines database columns
   - `@PrimaryKey()` - Defines primary key
   - `@ManyToOne()`, `@OneToMany()`, `@ManyToMany()` - Defines relationships
   - `@Embedded()` - Defines embedded objects

2. **GraphQL Decorators**
   - `@ObjectType()` - Marks class as GraphQL type
   - `@Field()` - Exposes properties to GraphQL schema
   - Scalar types: `Int`, `String`, `Date`

### Project Examples

#### Thread Entity

```typescript
@ObjectType()
@Entity({ tableName: 'threads' })
export class Thread extends BaseEntity {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => ThreadType)
  @Enum(() => ThreadType)
  type!: ThreadType;

  // Relationships
  @Field(() => [ThreadMessage])
  @OneToMany(() => ThreadMessage, (message) => message.thread, {
    lazy: true,
    ref: true,
  })
  messages = new Collection<ThreadMessage>(this);

  @Field(() => [User])
  @ManyToMany(() => User, 'threads', {
    pivotEntity: () => UserInterests,
    lazy: true,
    ref: true,
  })
  users: Collection<User> = new Collection<User>(this);
}

@ObjectType()
@Entity({ tableName: 'thread_messages' })
export class ThreadMessage extends BaseEntity {
  @Field(() => Thread)
  @ManyToOne(() => Thread, { ref: true, eager: false })
  thread!: Ref<Thread>;
}
```

#### Complex Properties (Embedded Entities)

```typescript
@ObjectType()
@Embeddable()
export class MessageMetadata {
  @Field(() => MessagePriority)
  @Property()
  priority: MessagePriority = MessagePriority.NORMAL;

  @Field(() => [String], { nullable: true })
  @Property({ nullable: true })
  tags?: string[];
}
```

### Domain Logic Considerations

Add methods to the entity to perform business logic.
The entity should not depend on any other entities or services.

### Libraries Used

- @mikro-orm/core - For ORM functionality and database mapping
- @nestjs/graphql - For GraphQL type definitions and schema generation

### Best Practices

1. Use appropriate nullability flags in both ORM and GraphQL decorators
2. Implement eager/lazy loading strategies based on use cases
3. Consider using Reference (Ref) types for relationships
4. Implement cascade operations where appropriate
5. Use embedded entities for complex property structures
6. Maintain separation between domain logic and database concerns
