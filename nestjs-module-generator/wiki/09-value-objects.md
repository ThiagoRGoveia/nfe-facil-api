## Value Objects

### Description and Applicability

Value Objects are immutable objects that describe characteristics or attributes of domain entities. Unlike entities, they don't have an identity and are considered equal if all their properties have the same values. They are used to encapsulate domain concepts and business rules related to specific attributes.

### Code Rules

1. Value Objects should be placed in the `domain/value-objects` directory
2. File naming convention: `{value-object-name}.value-object.ts` or for DTOs `{value-object-name}.dto.ts`
3. Class naming convention: PascalCase with descriptive name (e.g., `Money`, `Address`, `ThreadMessageData`)
4. Must be immutable (all properties should be readonly)
5. Should implement value equality (two value objects are equal if all their properties are equal)
6. Should validate their invariants in the constructor
7. Should be self-contained and include all business rules related to the value
8. Can extend or compose other value objects
9. Should not have side effects

### Examples

```typescript
export class Money {
  private constructor(private readonly amount: number, private readonly currency: string) {
    this.validateAmount(amount);
    this.validateCurrency(currency);
  }

  public static create(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  private validateAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }

  private validateCurrency(currency: string): void {
    const validCurrencies = ['USD', 'EUR', 'BRL'];
    if (!validCurrencies.includes(currency)) {
      throw new Error('Invalid currency');
    }
  }
}

// Example of a Value Object using GraphQL and DTO patterns
export class ThreadMessageDataDto extends OmitType(ThreadMessageDto, ['audio', 'images']) {
  readonly audioPaths?: string[];
  readonly imagePaths?: string[];
}
```

### Libraries Used

- typescript - For type definitions and immutability
- @nestjs/graphql - For GraphQL type transformations (when used with DTOs)
- class-validator - For validation rules (optional)
- class-transformer - For serialization (optional)
