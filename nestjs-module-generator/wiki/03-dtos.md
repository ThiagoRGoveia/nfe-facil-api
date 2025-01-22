## DTOs (Data Transfer Objects)

### Description and Applicability

DTOs are objects that define how data will be sent over the network between different parts of the application. They are used to encapsulate data and provide a clear contract for data structures in requests and responses.

### Code Rules

1. DTOs should be placed in the `application/dtos` directory
2. File naming convention: `{feature-name}.dto.ts`
3. Class naming convention: PascalCase with Dto suffix (e.g., `CreateThreadDto`)
4. Must use class-validator decorators for validation
5. Must use class-transformer decorators for serialization
6. Should be immutable (use readonly properties)
7. Should include property type definitions
8. Should include validation rules as decorators

### Examples

```typescript
export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsArray()
  @IsString({ each: true })
  readonly participantIds: string[];

  @IsOptional()
  @IsString()
  readonly initialMessage?: string;
}
```

### Libraries Used

- class-validator - For input validation decorators
- class-transformer - For serialization/deserialization
- @nestjs/swagger - For API documentation
