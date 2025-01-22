## Definition

We will build a module generator for this project. The module generator will receive a feature name and will generate the base files for a new module.
this module will use Mustache.js to create the base files for a new module. Use the provided folder structure, split your work in steps, iterate each folder and file type matching with the provided examples and generate a mustache template for it, ask for validation question if you need it, assume that the libraries used are: for database id mikro-orm, for framework nestjs, for testing nest.js. use
@Pluralize for generating file and class names based on the input name.
name casing:

- classes, types, enuma names UpperCamelCase
- variables, properties: lowerCamelCase
  -files: kebab-case
- enum properties, constants: UPPER_SNAKE_CASE
  -database table and column names: snake_case

## Feature - Template Rendering

The template rendering method will receive a path ending in a folder name as input, the folder name will always be in kebab case, so the code must have a function to modify the word to the correct case and tense to use for class and file names.

## Interface

This tool must be acessible as a CLI tool.

## Folder Structure

src/core/{feature-module}/
├── application/ # Application layer - orchestrates the flow of data and implements use cases
│ ├── dtos/ # Data Transfer Objects - defines shapes of input/output data
│ │ └── create-{feature}.dto.ts # DTOs for different operations (input validation, GraphQL types)
│ │ └── update-{feature}.dto.ts # DTOs for different operations (input validation, GraphQL types)
│ │ └── _.dto.ts # DTOs for different operations (input validation, GraphQL types)
│ │
│ ├── ports/ # Ports define interfaces that adapters must implement
│ │ └── {feature}-db.port.ts # Abstract classes/interfaces for external dependencies
│ │ └── _.port.ts # Abstract classes/interfaces for external dependencies
│ │
│ └── use-cases/ # Business use cases - application logic
│ ├── tests/ # Unit tests for use cases
│ │ └── _.spec.ts # should be named as the same name of the tested file followed by .spec.ts
│ └── _.use-case.ts # Implementation of specific use cases
│
├── domain/ # Domain layer - core business logic and rules
│ ├── constants/ # Domain-specific constants and enums
│ │ └── _.enum.ts
│ │
│ ├── entities/ # Domain entities - business objects and logic
│ │ └── {feature}.entity.ts # Entity for the feature will always be in singular
│ │ └── _.entity.ts # Related entities for the feature
│ │
│ ├── types/ # Custom types and interfaces for domain
│ │ └── _.type.ts
│ │
│ └── value-objects/ # Value Objects - immutable domain objects
│ └── _.dto.ts
│
├── infra/ # Infrastructure layer - external implementations
│ ├── adapters/ # Adapters implement ports for external services
│ │ ├── tests/ # Tests for adapters
│ │ │ └── _.spec.ts # Unit tests #should be named as the same name of the tested file followed by .spec.ts
│ │ │ └── _.it.test.ts # Integration tests that use a real database #should be named as the same name of the tested file followed by .it.test.ts
│ │ └── _.adapter.ts # Concrete implementations of ports
│ │
│ └── persistence/ # Database and storage implementations
│ └── db/
│ └── orm/ # ORM-specific implementations
│ ├── tests/
│ │ ├── _.spec.ts # Unit tests #should be named as the same name of the tested file followed by .spec.ts
│ │ └── _.it.test.ts # Integration tests #should be named as the same name of the tested file followed by .it.test.ts
│ └── {feature}-mikro-orm-db-repository.repository.ts # Database repositories
│
├── presenters/ # Presentation layer - handles input/output
│ └── graphql/ # GraphQL-specific implementations
│ ├── dtos/ # GraphQL-specific DTOs (if different from the application layer)
│ │ └── _.dto.ts
│ └── resolvers/ # GraphQL resolvers
│ ├── tests/
│ │ └── _.test.ts # Unit tests #should be named as the same name of the tested file followed by .spec.ts
│ │ └── _.it.test.ts # Integration tests #should be named as the same name of the tested file followed by .it.test.ts
│ └── {feature}.resolver.ts
│ └── \*.resolver.ts # Related resolvers for the feature
│
└── {feature}.module.ts # NestJS module definition

Example module
@user-messages

Docs
@Pluralize @Mustache.js

Output
Output all code to the folder module-generator/
