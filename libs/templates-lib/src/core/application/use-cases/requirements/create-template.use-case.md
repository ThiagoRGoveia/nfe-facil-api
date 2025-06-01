# Create Template

## Feature

As a user  
I want to create a template for processing PDF files  
So that I can extract structured data from PDFs using specific workflows

## Background

- Given the application is running
- And the database is available
- And the process manager is available

## Scenarios

### Successfully create a private template

**Given** I am an authenticated user  
**And** I have the following template information:

| field         | value                                  |
| ------------- | -------------------------------------- |
| name          | Invoice Template                       |
| process_code  | invoice-extractor                      |
| metadata      | {"fields": ["date", "total", "items"]} |
| output_format | json                                   |
| is_public     | false                                  |

**When** I execute the create template command  
**Then** a new template should be created in the database with:

| field         | value                                  |
| ------------- | -------------------------------------- |
| name          | Invoice Template                       |
| process_code  | invoice-extractor                      |
| metadata      | {"fields": ["date", "total", "items"]} |
| output_format | json                                   |
| is_public     | false                                  |
| owner         | {current user id}                      |

**And** a unique ID should be generated for the template

### Fail to create template with non-existent process code

**Given** I am an authenticated user  
**When** I execute the create template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | Invoice Template     |
| process_code  | non-existent         |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |
| is_public     | false                |

**Then** the operation should fail  
**And** I should receive an error message "Process code not found"  
**And** no template should be created in the database

### Fail to create template with invalid process metadata

**Given** I am an authenticated user  
**When** I execute the create template command with invalid metadata for the process:

| field         | value                    |
| ------------- | ------------------------ |
| name          | Invoice Template         |
| process_code  | invoice-extractor        |
| metadata      | {"invalid": "structure"} |
| output_format | json                     |
| is_public     | false                    |

**Then** the operation should fail  
**And** I should receive an error message "Invalid metadata for process"  
**And** no template should be created in the database

### Fail to create template with unsupported output format

**Given** I am an authenticated user  
**When** I execute the create template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | Invoice Template     |
| process_code  | invoice-extractor    |
| metadata      | {"fields": ["date"]} |
| output_format | unsupported-format   |
| is_public     | false                |

**Then** the operation should fail  
**And** I should receive an error message "Unsupported output format for process"  
**And** no template should be created in the database

### Fail to create template with duplicate private name

**Given** I am an authenticated user  
**And** I already have a private template named "Invoice Template"  
**When** I execute the create template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | Invoice Template     |
| process_code  | invoice-extractor    |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |
| is_public     | false                |

**Then** the operation should fail  
**And** I should receive an error message "Template name already exists for this user"  
**And** no template should be created in the database

### Fail to create template with missing required fields

**Given** I am an authenticated user  
**When** I execute the create template command with missing required fields:

| field         | value            |
| ------------- | ---------------- |
| name          | Invoice Template |
| process_code  |                  |
| metadata      |                  |
| output_format |                  |

**Then** the operation should fail  
**And** I should receive an error message "All fields are required"  
**And** no template should be created in the database

### Fail to create public template as regular user

**Given** I am an authenticated user without admin privileges  
**When** I execute the create template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | Invoice Template     |
| process_code  | invoice-extractor    |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |
| is_public     | true                 |

**Then** the operation should fail  
**And** I should receive an error message "Users cannot create public templates"  
**And** no template should be created in the database

### Fail to create template with invalid metadata format

**Given** I am an authenticated user  
**When** I execute the create template command with invalid metadata:

| field        | value               |
| ------------ | ------------------- |
| name         | Invoice Template    |
| process_code | invoice-extractor   |
| metadata     | invalid-json-format |
| is_public    | false               |

**Then** the operation should fail  
**And** I should receive an error message "Invalid metadata format"  
**And** no template should be created in the database
