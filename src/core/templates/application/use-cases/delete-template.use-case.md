# Delete Template

## Feature

As a user  
I want to delete my existing template  
So that I can remove templates that I no longer need

## Background

- Given the application is running
- And the database is available

## Scenarios

### Successfully delete private template

**Given** I am an authenticated user  
**And** I own a template with ID "template-123" with information:

| field        | value                     |
| ------------ | ------------------------- |
| name         | My Template               |
| process_code | pdf-extractor             |
| metadata     | {"fields": ["old_field"]} |
| is_public    | false                     |
| owner        | {current user id}         |

**When** I execute the delete template command for template ID "template-123"  
**Then** the template should be removed from the database  
**And** subsequent queries for this template should return "not found"

### Fail to delete non-existent template

**Given** I am an authenticated user  
**When** I execute the delete template command for template ID "non-existent-id"  
**Then** the operation should fail  
**And** I should receive an error message "Template not found"

### Fail to delete template owned by another user

**Given** I am an authenticated user  
**And** a template exists with ID "template-456" owned by another user  
**When** I execute the delete template command for template ID "template-456"  
**Then** the operation should fail  
**And** I should receive an error message "You don't have permission to delete this template"  
**And** the template should remain in the database

### Fail to delete public template as regular user

**Given** I am an authenticated user without admin privileges  
**And** a public template exists with ID "template-789"  
**When** I execute the delete template command for template ID "template-789"  
**Then** the operation should fail  
**And** I should receive an error message "You don't have permission to delete public templates"  
**And** the template should remain in the database

### Successfully delete template with database error handling

**Given** I am an authenticated user  
**And** I own a template with ID "template-123"  
**But** the database connection is unstable  
**When** I execute the delete template command for template ID "template-123"  
**Then** the operation should fail gracefully  
**And** I should receive an error message "Failed to delete template"  
**And** the error should be logged for system administrators
