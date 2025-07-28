# NFe Fácil API

This repository contains a DEMO for a backend service for the an application that uses LLMs to extract data from documents. It is a monorepo managed with pnpm workspaces, containing multiple NestJS applications and libraries.

It is deployed using the Serverless Stack (SST) on AWS and uses SQS for message processing.

## About the project

The project is structured as a monorepo with the following applications:

- `api`: The main API for the application.
- `public-api`: A public-facing API with limited access.
- `contact-form-api`: An API for handling contact form submissions.
- `document-processing-api`: An API for processing documents.
- `process-document-job`: A job for processing documents.
- `output-consolidation-job`: A job for consolidating output.
- `credit-spending-job`: A job for managing credit spending.
- `webhook-dispatch-job`: A job for dispatching webhooks.

## Getting Started

To get the project up and running, follow these steps:

1.  Install the dependencies:

```bash
$ pnpm install
```

2.  Set up your environment variables by creating a `.env` file in the root of the project. You can use the `.env.example` file as a template.

3.  Run the database migrations:

```bash
$ pnpm run db-migrations:up
```

## Available Scripts

### Build

- `pnpm run build`: Compiles all applications.

### Running the applications

Each application has its own set of scripts for running in different environments:

- `pnpm run <app-name>:start`: Starts the application.
- `pnpm run <app-name>:start:dev`: Starts the application in watch mode.
- `pnpm run <app-name>:start:debug`: Starts the application in debug mode.
- `pnpm run <app-name>:start:prod`: Starts the application in production mode.

Replace `<app-name>` with the name of the application you want to run (e.g., `api`, `public-api`, etc.).

### Testing

- `pnpm run test`: Runs the unit tests.
- `pnpm run test:cov`: Runs the unit tests and generates a coverage report.
- `pnpm run test:e2e`: Runs the end-to-end tests.

### Database Migrations

- `pnpm run db-migrations:generate`: Generates a new migration.
- `pnpm run db-migrations:up`: Runs all pending migrations.
- `pnpm run db-migrations:down`: Reverts the last migration.
- `pnpm run db-migrations:list`: Lists all migrations and their status.

### API Documentation

- `pnpm run nfse-doc:generate`: Generates the API documentation.
- `pnpm run nfse-doc:deploy:uat`: Deploys the API documentation to the UAT environment.
- `pnpm run nfse-doc:deploy:prod`: Deploys the API documentation to the production environment.

### Deployment

The application is deployed using the Serverless Stack (SST).

- `pnpm run sst:deploy:dev`: Deploys the application to the development environment.
- `pnpm run sst:deploy:uat`: Deploys the application to the UAT environment.
- `pnpm run sst:deploy:prod`: Deploys the application to the production environment.
- `pnpm run sst:remove:dev`: Removes the application from the development environment.

## License

This project is [UNLICENSED](./LICENSE).
