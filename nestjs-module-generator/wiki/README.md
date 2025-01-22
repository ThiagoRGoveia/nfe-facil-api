# Project Code Guidelines Wiki

This wiki contains the definitions and code guidelines that developers must follow when creating new features in the project. The project follows a Clean Architecture approach with Domain-Driven Design (DDD) principles.

## Table of Contents

1. [Use Cases](./01-use-cases.md) - Business logic orchestration
2. [Ports](./02-ports.md) - Interface definitions for external dependencies
3. [DTOs](./03-dtos.md) - Data transfer objects for API communication
4. [Entities](./04-entities.md) - Domain objects and business rules
5. [Repositories](./05-repositories.md) - Data persistence implementations
6. [Factories](./06-factories.md) - Test data generation utilities
7. [Resolvers](./07-resolvers.md) - GraphQL operation handlers
8. [Adapters](./08-adapters.md) - External service and library integrations
9. [Value Objects](./09-value-objects.md) - Domain value objects and attributes

## Project Structure

```
src/
├── core/
│   └── {feature}/
│       ├── application/
│       │   ├── dtos/
│       │   ├── ports/
│       │   └── use-cases/
│       ├── domain/
│       │   ├── entities/
│       │   ├── value-objects/
│       │   └── services/
│       ├── infra/
│       │   ├── persistence/
│       │   ├── adapters/
│       │   └── external-services/
│       └── presenters/
│           └── graphql/
└── infra/
    └── tests/
        └── factories/
```

## Key Principles

1. **Separation of Concerns**: Each type of file has a specific responsibility and should not mix concerns
2. **Dependency Rule**: Dependencies should point inward, with domain at the center
3. **Interface Segregation**: Ports should be specific to their use case needs
4. **Dependency Injection**: Use constructor injection for dependencies
5. **Single Responsibility**: Each class should have one reason to change
6. **Domain-Driven Design**: Business logic should be in the domain layer
7. **Test-Driven Development**: Use factories to facilitate testing
8. **Value Object Pattern**: Use value objects to encapsulate domain concepts and validations

## Getting Started

When creating a new feature:

1. Start with the domain entities and value objects
2. Create DTOs for the API interface
3. Define ports for external dependencies
4. Implement use cases using the ports
5. Create repositories implementing the ports
6. Create adapters for external services/libraries
7. Add resolvers to expose the functionality
8. Create factories for testing

For detailed guidelines on each component, refer to their respective documentation pages.
