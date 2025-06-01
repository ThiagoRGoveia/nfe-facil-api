# Refresh User Client Secret

## Feature

As a system administrator  
I want to refresh a user's client secret  
So that I can maintain security by rotating credentials

## Background

- Given the application is running
- And the database is available

## Scenarios

### Successfully refresh client secret

**Given** a user exists with ID 1  
**And** their current client secret is "old-secret-123"  
**When** I execute the refresh client secret command  
**Then** the user's client secret should be updated  
**And** the new client secret should be different from "old-secret-123"  
**And** the user's other information should remain unchanged

### Fail to refresh client secret for non-existent user

**Given** no user exists with ID 999  
**When** I execute the refresh client secret command for user 999  
**Then** the operation should fail  
**And** I should receive an error message "User not found"  
**And** no changes should be made to the database

### Fail to refresh client secret due to database error

**Given** a user exists with ID 1  
**But** the database connection is lost  
**When** I execute the refresh client secret command  
**Then** the operation should fail  
**And** I should receive an error message "Failed to refresh user client secret"  
**And** the user's client secret should remain unchanged

### Refresh client secret maintains format

**Given** a user exists with ID 1  
**When** I execute the refresh client secret command  
**Then** the new client secret should be generated  
**And** the new client secret should match the required format  
**And** the operation should be logged
