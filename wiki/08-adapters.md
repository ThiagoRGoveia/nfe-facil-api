## Adapters

### Description and Applicability

Adapters are classes that implement external service integrations or wrap third-party libraries. They provide a clean interface to external dependencies and implement the corresponding ports. This pattern allows for easy replacement of external dependencies and better testability.

### Code Rules

1. Adapters should be placed in the `infra/adapters` directory
2. File naming convention: `{library-name}-adapter.ts` or `{service-name}.adapter.ts`
3. Class naming convention: PascalCase with Adapter suffix (e.g., `DateFnsAdapter`, `UuidAdapter`)
4. Must implement a corresponding Port interface when applicable
5. Should be decorated with @Injectable()
6. Should encapsulate all direct interactions with external libraries
7. Should provide a clean and simple interface to the application
8. Should handle library-specific error handling and conversions

### Examples

```typescript
@Injectable()
export class DateFnsAdapter implements DatePort {
  isThisWeek(date: Date): boolean {
    return isDateThisWeek(date);
  }

  format(date: Date, format: string): string {
    return formatDate(date, format);
  }

  addBusinessDays(date: Date, days: number): Date {
    return addBusinessDaysPrincipal(date, days);
  }
}

@Injectable()
export class UuidAdapterCore {
  public generate() {
    return uuidv4();
  }
}
```

### Libraries Used

- @nestjs/common - For dependency injection
- Various third-party libraries being adapted (e.g., date-fns, uuid)
