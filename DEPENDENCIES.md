# Module Dependencies

This document outlines the module dependencies for each application in the `apps` directory. Paths starting with `@/` are assumed to resolve to the `src` directory of the `api` application if not otherwise specified within the app itself. Local paths `./` or `../` are relative to the current module's file.

## 1. `api`

-   **`AppModule`** (`apps/api/src/app.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
        -   `FeatureModule` (local: `apps/api/src/core/feature.module.ts`)
        -   `ToolingModule` (local: `apps/api/src/infra/tooling.module.ts`)
        -   `baseImports` (local utility)
-   **`FeatureModule`** (`apps/api/src/core/feature.module.ts`)
    -   Dynamically Imports (all local to `api` app's `core` directory):
        -   `DocumentsModule`
        -   `TemplatesModule`
        -   `WebhooksModule`
        -   `UsersModule`
        -   `UserCreditsModule`
-   **`DocumentsModule`** (`apps/api/src/core/documents/documents.module.ts`)
    -   Self-contained (no explicit local module imports).
-   **`TemplatesModule`** (`apps/api/src/core/templates/templates.module.ts`)
    -   Self-contained.
-   **`WebhooksModule`** (`apps/api/src/core/webhooks/webhooks.module.ts`)
    -   Self-contained.
-   **`UsersModule`** (`apps/api/src/core/users/users.module.ts`)
    -   Self-contained.
-   **`UserCreditsModule`** (`apps/api/src/core/user-credits/user-credits.module.ts`)
    -   Self-contained.
-   **`ToolingModule`** (`apps/api/src/infra/tooling.module.ts`)
    -   Imports:
        -   `AuthModule` (local: `apps/api/src/infra/auth/auth.module.ts`)
        -   `DocumentProcessModule` (cross-app: `apps/process-document-job/src/core/document-process.module.ts`)
        -   `HttpModule` (NestJS common)
-   **`AuthModule`** (`apps/api/src/infra/auth/auth.module.ts`)
    -   Imports:
        -   `PassportModule` (NestJS common)
    -   Self-contained regarding local app modules.
-   **`S3Module`** (`apps/api/src/infra/aws/s3/s3.module.ts`)
    -   Self-contained.
-   **`NFSeDocModule`** (`apps/api/src/infra/swagger/nfe-facil/nfse-doc.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
    -   Self-contained regarding local app modules (uses stubs).

## 2. `contact-form-api`

-   **`AppModule`** (`apps/contact-form-api/src/app.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
        -   `LoggerModule` (NestJS common)
        -   `ContactFormModule` (local: `apps/contact-form-api/src/modules/contact-form/contact-form.module.ts`)
-   **`ContactFormModule`** (`apps/contact-form-api/src/modules/contact-form/contact-form.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
    -   Self-contained regarding other local or cross-app modules.

## 3. `credit-spending-job`

-   **`AppModule`** (`apps/credit-spending-job/src/app.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
        -   `ToolingModule` (cross-app: `@/infra/tooling.module.ts` from `api` app)
        -   `FeatureModule` (cross-app: `@/core/feature.module.ts` from `api` app, registered with 'none')
        -   `baseImports` (cross-app: `apps/api/base-module-imports` from `api` app)

## 4. `output-consolidation-job`

-   **`AppModule`** (`apps/output-consolidation-job/src/app.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
        -   `ToolingModule` (cross-app: `@/infra/tooling.module.ts` from `api` app)
        -   `FeatureModule` (cross-app: `@/core/feature.module.ts` from `api` app, registered with 'none')
        -   `baseImports` (cross-app: `apps/api/base-module-imports` from `api` app)

## 5. `process-document-job`

-   **`AppModule`** (`apps/process-document-job/src/app.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
        -   `ToolingModule` (cross-app: `@/infra/tooling.module.ts` from `api` app)
        -   `FeatureModule` (cross-app: `@/core/feature.module.ts` from `api` app, registered with 'none')
        -   `baseImports` (cross-app: `apps/api/base-module-imports` from `api` app)
-   **`DocumentProcessModule`** (`apps/process-document-job/src/core/document-process.module.ts`)
    -   Global module.
    -   No explicit local module imports.
    -   Exports `NfeTextWorkflow`.
    -   **Note:** This module is imported by `ToolingModule` in the `api` application.
-   **`ProcessDocumentJobModule`** (`apps/process-document-job/src/core/process-document-job.module.ts`)
    -   No explicit local module imports.

## 6. `public-api`

-   **`AppModule`** (`apps/public-api/src/app.module.ts`)
    -   Dynamic module.
    -   Imports:
        -   `ConfigModule` (NestJS common)
        -   `LoggerModule` (NestJS common)
    -   No explicit dependencies on other local or cross-app modules.

## 7. `sync-process-apis`

-   No `.module.ts` files found. Assumed not a NestJS application or has no relevant modules for this analysis.

## 8. `webhook-dispatch-job`

-   **`AppModule`** (`apps/webhook-dispatch-job/src/app.module.ts`)
    -   Imports:
        -   `ConfigModule` (NestJS common)
        -   `baseImports` (cross-app: `apps/api/base-module-imports` from `api` app)
    -   Providers utilize components imported via `@/` paths, indicating dependencies on the `api` app:
        -   `HttpClientPort` (from `api/src/core/webhooks/application/ports/http-client.port`)
        -   `HttpClientAdapter` (from `api/src/core/webhooks/infra/adapters/http-client.adapter`)
        -   `EncryptionAdapter` (from `api/src/infra/encryption/adapters/encryption.adapter`)
        -   `EncryptionPort` (from `api/src/infra/encryption/ports/encryption.port`)
        -   `WebhookDeliveryDbPort` (defined in `api/src/core/webhooks/webhooks.module.ts`)
        -   `WebhookDeliveryMikroOrmDbRepository` (from `api/src/core/webhooks/infra/persistence/db/orm/webhook-delivery-mikro-orm-db.repository`)

