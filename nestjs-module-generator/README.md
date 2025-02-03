# NOTICE

This is an experimental project that was generated almost entirely by AI. Do not expect it to be perfect, check the generated code and improve it if necessary.

# NestJS Module Generator

The generator creates a full module structure with all necessary files, including entities, repositories, use cases, resolvers, and tests.

## Features

- Generates complete module structure following clean architecture principles
- Creates all necessary files with proper naming conventions
- Includes unit and integration tests
- Supports both REST and GraphQL presenters
- Includes MikroORM database integration
- Follows project's testing patterns and conventions
- Handles proper casing for different file types (kebab-case, PascalCase, etc.)
- Automatically generates test factories
- Supports generating individual files by type
- Supports create/update operations for use cases
- Supports generating multiple custom use cases in one command
- Flexible presenter generation (REST, GraphQL, or both)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd module-generator
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm run build
```

4. Link the CLI tool globally:

```bash
npm link
```

## Usage

### Generate Complete Module

To generate a complete module with all files:

```bash
nest-module-gen generate <feature-name> [options]
```

Examples:

```bash
# Generate module with REST controllers (default)
nest-module-gen generate user-profiles

# Generate module with GraphQL resolvers
nest-module-gen generate user-profiles --presenter graphql

# Generate module with both REST and GraphQL
nest-module-gen generate user-profiles --presenter all

# Generate module with custom use cases and GraphQL
nest-module-gen generate user-profiles --presenter graphql --use-case archive-profile restore-profile
```

You can also generate a module with additional custom use cases:

```bash
# Generate module with multiple use cases
nest-module-gen generate user-profiles --use-case archive-profile restore-profile block-user

# Or using multiple -u flags
nest-module-gen generate user-profiles -u archive-profile -u restore-profile -u block-user
```

### Generate Individual Files

To generate a specific file type:

```bash
nest-module-gen generate <feature-name> --type <file-type>
```

Available file types:

- `module` - Main module file
- `entity` - Entity definition
- `resolver` - GraphQL resolver
- `resolver-test` - GraphQL resolver integration test
- `db-port` - Database port interface
- `repository` - MikroORM repository
- `repository-test` - Repository unit test
- `repository-it-test` - Repository integration test
- `create-dto` - Create DTO
- `update-dto` - Update DTO
- `use-case` - Use case implementation (requires --operation)
- `use-case-test` - Use case unit test (requires --operation)
- `factory` - Test factory

### Use Case Generation

When generating use cases or their tests, you can specify the operation type:

```bash
# Generate create use case
nest-module-gen generate user-profiles --type use-case --operation create

# Generate update use case
nest-module-gen generate user-profiles --type use-case --operation update

# Generate custom use case
nest-module-gen generate user-profiles --type use-case --operation archive

# Generate use case tests
nest-module-gen generate user-profiles --type use-case-test --operation create
nest-module-gen generate user-profiles --type use-case-test --operation update
nest-module-gen generate user-profiles --type use-case-test --operation archive
```

The operation flag supports:

- `create` - Generates create operation with proper DTOs and validation
- `update` - Generates update operation with proper DTOs and validation
- `custom` - Any other operation name will generate a basic use case structure with:
  - Default user input interface
  - Injected database port
  - Empty execute method ready for implementation
  - Basic test setup with dependency injection checks

Example of a custom use case:

```typescript
// archive-user-profile.use-case.ts
@Injectable()
export class ArchiveUserProfileUseCase {
  constructor(private readonly userProfileDbPort: UserProfileDbPort) {}

  async execute({ user }: ArchiveUserProfileInput): Promise<UserProfile | void> {
    // TODO: Implement archive logic
  }
}
```

### Custom Output Path

You can specify a custom output path for any generated file:

```bash
nest-module-gen generate user-profiles --type entity --output ./src/custom/path/user-profile.entity.ts
```

### Command Options

- `-p, --path <path>` - Base path of the project (default: current directory)
- `-t, --type <type>` - Type of file to generate
- `-o, --output <path>` - Custom output path for the generated file
- `--operation <operation>` - Operation type for use cases (create/update)
- `-u, --use-case <names...>` - Names of use cases to generate (can specify multiple)
- `--presenter <type>` - Type of presenter to generate (rest, graphql, all) (default: rest)

The feature name should be in kebab-case format. The generator will automatically handle all necessary case transformations.

## Generated Structure

The generator creates the following structure for each module:

```
src/core/{feature-name}/
├── application/
│   ├── dtos/
│   │   ├── create-{feature}.dto.ts
│   │   └── update-{feature}.dto.ts
│   ├── ports/
│   │   └── {feature}-db.port.ts
│   └── use-cases/
│       ├── tests/
│       │   ├── create-{feature}.use-case.spec.ts
│       │   └── update-{feature}.use-case.spec.ts
│       ├── create-{feature}.use-case.ts
│       └── update-{feature}.use-case.ts
├── domain/
│   ├── constants/
│   ├── entities/
│   │   └── {feature}.entity.ts
│   ├── types/
│   └── value-objects/
├── infra/
│   ├── adapters/
│   │   └── tests/
│   └── persistence/
│       └── db/
│           └── orm/
│               ├── tests/
│               │   ├── {feature}-mikro-orm-db.repository.spec.ts
│               │   └── {feature}-mikro-orm-db.repository.it.test.ts
│               └── {feature}-mikro-orm-db.repository.ts
├── presenters/
│   └── graphql/
│       ├── dtos/
│       └── resolvers/
│           ├── tests/
│           │   └── {feature}.resolver.it.test.ts
│           └── {feature}.resolver.ts
└── {feature}.module.ts
```

## Generated Files

The generator creates the following types of files:

1. **Module Files**

   - Main module file
   - Entity definitions
   - Database ports and repositories

2. **GraphQL Files**

   - Resolvers with CRUD operations
   - Input/Output DTOs

3. **Test Files**

   - Unit tests for use cases (create/update)
   - Unit tests for repositories
   - Integration tests for repositories
   - Integration tests for resolvers
   - Test factories

4. **Use Cases**
   - Create use case with validation
   - Update use case with validation
   - Use case interfaces and implementations

## Naming Conventions

The generator follows these naming conventions:

- Classes, types, enums: `UpperCamelCase`
- Variables, properties: `lowerCamelCase`
- Files: `kebab-case`
- Enum properties, constants: `UPPER_SNAKE_CASE`
- Database tables and columns: `snake_case`

## Development

To modify or extend the generator:

1. Update templates in `src/templates/`
2. Add new file types in `src/generator.ts`
3. Build the project: `npm run build`
4. Test your changes: `npm link && nest-module-gen generate test-feature`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC
