# Proposed Shared Libraries (@libs)

This document outlines modules and components identified for extraction into shared libraries as part of the codebase reorganization. The goal is to ensure each Lambda function only consumes the code it needs, adhering to the new architectural guidelines.

**Key Architectural Changes:**
-   `FeatureModule` and `ToolingModule` from the `api` app will be dismantled.
-   Controllers will be moved out of feature-specific logic and reside directly within the API-facing applications (`api`, `public-api`).
-   Each application will have a clearly defined set of responsibilities and dependencies.

## 1. Libraries Derived from `api/src/core/FeatureModule`

The following modules, currently sub-modules of `api`'s `FeatureModule`, are proposed to become shared libraries. These libraries will contain services, use cases, data ports, and adapters, but **not** controllers or GraphQL resolvers (which will move to the respective API apps).

-   **`UsersLib`**
    -   **Contents:** User entity management, authentication-related user data operations, user profile services.
    -   **Original Module:** `UsersModule`
    -   **Potential Consumers:** `api` (GraphQL), `public-api` (REST).

-   **`UserCreditsLib`**
    -   **Contents:** User credit management, transaction logic, credit balance services.
    -   **Original Module:** `UserCreditsModule`
    -   **Potential Consumers:** `api` (GraphQL), `public-api` (REST), `credit-spending-job`.

-   **`DocumentsLib`**
    -   **Contents:** Document storage, retrieval, metadata management, versioning logic.
    -   **Original Module:** `DocumentsModule`
    -   **Potential Consumers:** `api` (GraphQL), `public-api` (REST), `output-consolidation-job`, `process-document-job`, `sync-process-apis` (Future).

-   **`TemplatesLib`**
    -   **Contents:** Management of document/communication templates.
    -   **Original Module:** `TemplatesModule`
    -   **Potential Consumers:** `api` (GraphQL), `public-api` (REST), `sync-process-apis` (Future).

-   **`WebhooksLib`**
    -   **Contents:** Webhook registration, event management, delivery attempt tracking (e.g., `WebhookDeliveryDbPort`).
    -   **Original Module:** `WebhooksModule`
    -   **Potential Consumers:** `api` (GraphQL for management), `webhook-dispatch-job` (for dispatching).

## 2. Libraries Derived from `api/src/infra/ToolingModule`

The `ToolingModule` was a global module in the `api` app, providing various infrastructure adapters and ports. Its direct imports were `AuthModule` (handled by `AuthLib`), `DocumentProcessModule` (contents moved to `NfeProcessingLib` and `PdfProcessingLib`), and `HttpModule` (NestJS common).

The following libraries are proposed based on `ToolingModule`'s providers and exports:

-   **`EncryptionLib`** (already listed, confirmed from ToolingModule)
    -   **Contents:** `EncryptionPort`, `EncryptionAdapter`.
    -   **Potential Consumers:** `webhook-dispatch-job`, others needing data protection.

-   **`UuidLib`** (New)
    -   **Contents:** `UuidAdapter`.
    -   **Potential Consumers:** Any app needing UUID generation.

-   **`SecretsLib`** (New)
    -   **Contents:** `SecretAdapter` (for managing application secrets, e.g., from a secret manager).
    -   **Potential Consumers:** Any app needing secure secret retrieval.

-   **`DateLib`** (New)
    -   **Contents:** `DatePort`, `DateAdapter`.
    -   **Potential Consumers:** Any app needing date/time utilities.

-   **`FileStorageLib (S3)`** (Refined `S3Lib`, confirmed from ToolingModule)
    -   **Contents:** `FileStoragePort`, `S3Client`.
    -   **Potential Consumers:** `output-consolidation-job`, `api`, `public-api`.

-   **`QueueLib (SQS)`** (Refined `SQSLib`, confirmed from ToolingModule)
    -   **Contents:** `QueuePort`, `SQSAdapter`, `SQSClient`.
    -   **Potential Consumers:** `credit-spending-job`, `output-consolidation-job`, `process-document-job`, `webhook-dispatch-job`.

-   **`SqlEntityManagerProvider`** (Part of `DatabaseLib`)
    -   **Contents:** Provision of `SqlEntityManager` via `EntityManager`.
    -   **Note:** This is a core part of database setup, to be included in `DatabaseLib`.

## 3. Common Infrastructure & Utility Libraries

These libraries provide foundational capabilities.

-   **`AuthLib`**
    -   **Contents:** Core authentication logic, strategies (e.g., JWT), guards. Derived from `api/src/infra/auth/auth.module.ts` (currently part of `ToolingModule`'s imports).
    -   **Potential Consumers:** `api` (GraphQL), `public-api` (REST).

-   **`DatabaseLib`**
    -   **Contents:** Provides `MikroOrmModule.forRootAsync` configuration (derived from `baseImports`). Includes setup for connection, migrations, dataloader, caching. Also includes the `SqlEntityManagerProvider` (from `ToolingModule`).
    -   **Critical Note:** Entity definitions (currently in `apps/api/src/infra/persistence/mikro-orm/entities`) must be moved to this library or a commonly accessible shared location for this library to be truly independent.
    -   **Potential Consumers:** All applications requiring database access.

-   **`AwsSdkLib`** (or more specific AWS service libs)
    -   **Contents:** Encapsulated AWS SDK clients and common operations.
    -   **Sub-Libraries / Specific Libs:**
        -   **`FileStorageLib (S3)`**: (Covered in Section 2)
        -   **`SESLib`**: For SES operations. Consumers: `contact-form-api`.
        -   **`QueueLib (SQS)`**: (Covered in Section 2)

-   **`HttpClientLib`**
    -   **Contents:** Standardized HTTP client port and adapter (e.g., based on `HttpClientPort` from `api/src/core/webhooks/application/ports/http-client.port` and `HttpClientAdapter` from `api/src/core/webhooks/infra/adapters/http-client.adapter`).
    -   **Potential Consumers:** `process-document-job`, `webhook-dispatch-job`, `sync-process-apis` (Future).

-   **`EncryptionLib`**: (Covered in Section 2)

## 4. Specialized Processing Libraries

These libraries encapsulate domain-specific processing logic.

-   **`NfeProcessingLib`**
    -   **Contents:** NFSe-related logic, text processing workflows (e.g., `NfeTextWorkflow` from `process-document-job/src/core/document-process.module.ts`).
    -   **Potential Consumers:** `process-document-job`, `sync-process-apis` (Future).

-   **`PdfProcessingLib`**
    -   **Contents:** PDF generation or manipulation utilities (e.g., `PdfPort/PdfAdapter` from `process-document-job/src/core/document-process.module.ts`).
    -   **Potential Consumers:** `process-document-job`, `sync-process-apis` (Future).

## 5. File Format & Manipulation Libraries (from ToolingModule)

-   **`ZipLib`** (New)
    -   **Contents:** `ZipPort`, `ZipAdapter`.
    -   **Potential Consumers:** Apps needing zip/unzip functionality.

-   **`CsvLib`** (New)
    -   **Contents:** `CsvPort`, `Json2CsvAdapter`.
    -   **Potential Consumers:** Apps needing CSV generation/parsing.

-   **`ExcelLib`** (New)
    -   **Contents:** `ExcelPort`, `ExcelJsAdapter`.
    -   **Potential Consumers:** Apps needing Excel file manipulation.

## 6. AI Client Libraries (from ToolingModule)

-   **`OllamaClientLib`** (New)
    -   **Contents:** `OllamaClient`.
    -   **Potential Consumers:** Apps interacting with Ollama AI.

-   **`TogetherClientLib`** (New)
    -   **Contents:** `TogetherClient`.
    -   **Potential Consumers:** Apps interacting with Together AI.

## 7. LoggerLib (from baseImports)

-   **`LoggerLib`** (New)
    -   **Contents:** Provides `LoggerModule.forRootAsync` configuration (derived from `baseImports`) for `nestjs-pino`, including conditional pretty-printing.
    -   **Potential Consumers:** All applications for standardized logging.

## 8. Notes on `baseImports` and Common Modules

The `baseImports` array (from `apps/api/base-module-imports.ts`) was analyzed and its key contributions are:
-   **`MikroOrmModule.forRootAsync`**: This forms the core of the `DatabaseLib` (see Section 3).
-   **`LoggerModule.forRootAsync`**: This forms the core of the `LoggerLib` (see Section 7).
-   **`HttpModule`**: This is a standard NestJS module. Applications can import it directly or use the more specialized `HttpClientLib` (Section 3) if a common port/adapter pattern is desired for internal HTTP calls.
-   **`ConfigModule`**: While not directly provided by `baseImports` as a module for export, `ConfigService` is heavily used in the factory functions within `baseImports`. This implies that applications consuming libraries derived from `baseImports` (like `DatabaseLib`, `LoggerLib`) will need to have `ConfigModule.forRoot({ isGlobal: true })` or similar configured to make `ConfigService` available for injection.

## Next Steps

1.  **Review Entity Locations:** Determine the best strategy for sharing database entity definitions (currently in `api` app) to support `DatabaseLib`.
2.  **Refine Consumer Mappings:** Double-check which applications will consume each proposed library based on the new architectural rules.
3.  **Plan Implementation:** Outline the steps for creating these libraries and refactoring the applications.
