# Update Template

## Feature

As a user  
I want to update my existing template  
So that I can modify its configuration for processing PDF files

## Background

- Given the application is running
- And the database is available
- And the process manager is available

## Scenarios

### Successfully update private template

**Given** I am an authenticated user  
**And** I own a template with ID "template-123" with current information:

| field         | value                     |
| ------------- | ------------------------- |
| name          | Old Template              |
| process_code  | old-extractor             |
| metadata      | {"fields": ["old_field"]} |
| output_format | json                      |
| is_public     | false                     |
| owner         | {current user id}         |

**When** I execute the update template command with:

| field         | value                                  |
| ------------- | -------------------------------------- |
| name          | New Template Name                      |
| process_code  | new-extractor                          |
| metadata      | {"fields": ["date", "total", "items"]} |
| output_format | excel                                  |

**Then** the template should be updated in the database with:

| field         | value                                  |
| ------------- | -------------------------------------- |
| name          | New Template Name                      |
| process_code  | new-extractor                          |
| metadata      | {"fields": ["date", "total", "items"]} |
| output_format | excel                                  |
| is_public     | false                                  |
| owner         | {current user id}                      |

### Fail to update template with non-existent process code

**Given** I am an authenticated user  
**And** I own a template with ID "template-123"  
**When** I execute the update template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | New Template Name    |
| process_code  | non-existent         |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |

**Then** the operation should fail  
**And** I should receive an error message "Process code not found"  
**And** the template should remain unchanged

### Fail to update template with invalid process metadata

**Given** I am an authenticated user  
**And** I own a template with ID "template-123"  
**When** I execute the update template command with invalid metadata:

| field         | value                    |
| ------------- | ------------------------ |
| name          | New Template Name        |
| process_code  | invoice-extractor        |
| metadata      | {"invalid": "structure"} |
| output_format | json                     |

**Then** the operation should fail  
**And** I should receive an error message "Invalid metadata for process"  
**And** the template should remain unchanged

### Fail to update template with unsupported output format

**Given** I am an authenticated user  
**And** I own a template with ID "template-123"  
**When** I execute the update template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | New Template Name    |
| process_code  | invoice-extractor    |
| metadata      | {"fields": ["date"]} |
| output_format | unsupported-format   |

**Then** the operation should fail  
**And** I should receive an error message "Unsupported output format for process"  
**And** the template should remain unchanged

### Fail to update non-existent template

**Given** I am an authenticated user  
**When** I execute the update template command for template ID "non-existent-id" with:

| field         | value                |
| ------------- | -------------------- |
| name          | New Template Name    |
| process_code  | new-extractor        |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |

**Then** the operation should fail  
**And** I should receive an error message "Template not found"

### Fail to update template owned by another user

**Given** I am an authenticated user  
**And** a template exists with ID "template-456" owned by another user  
**When** I execute the update template command for that template with:

| field         | value                |
| ------------- | -------------------- |
| name          | New Template Name    |
| process_code  | new-extractor        |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |

**Then** the operation should fail  
**And** I should receive an error message "You don't have permission to update this template"

### Fail to update template with duplicate name

**Given** I am an authenticated user  
**And** I own a template with ID "template-123"  
**And** I already have another template named "Existing Template"  
**When** I execute the update template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | Existing Template    |
| process_code  | new-extractor        |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |

**Then** the operation should fail  
**And** I should receive an error message "Template name already exists for this user"  
**And** the template should remain unchanged

### Fail to update public/private status

**Given** I am an authenticated user without admin privileges  
**And** I own a private template with ID "template-123"  
**When** I execute the update template command with:

| field         | value                |
| ------------- | -------------------- |
| name          | Valid Name           |
| process_code  | new-extractor        |
| metadata      | {"fields": ["date"]} |
| output_format | json                 |
| is_public     | true                 |

**Then** the operation should fail  
**And** I should receive an error message "Users cannot modify template visibility"  
**And** the template should remain private
