# Create User

## Feature

As a system administrator  
I want to create new user accounts  
So that users can access the system with their credentials

## Background

- Given the application is running
- And the Auth0 service is available

## Scenarios

### Successfully create a new user

**Given** I have the following user information:

| field    | value          |
| -------- | -------------- |
| name     | John           |
| surname  | Doe            |
| email    | john@email.com |
| password | SecurePass123! |
| role     | CUSTOMER       |

**When** I execute the create user command  
**Then** a new user should be created in Auth0  
**And** a new user should be created in our database with:

| field   | value          |
| ------- | -------------- |
| name    | John           |
| surname | Doe            |
| email   | john@email.com |
| role    | CUSTOMER       |

**And** the user should have a generated client ID  
**And** the user should have a generated client secret  
**And** the user's Auth0 ID should be stored

### Fail to create user with invalid email

**Given** I have the following user information:

| field    | value          |
| -------- | -------------- |
| name     | John           |
| surname  | Doe            |
| email    | invalid-email  |
| password | SecurePass123! |

**When** I execute the create user command  
**Then** the operation should fail  
**And** I should receive an error message "Failed to create user"  
**And** no user should be created in the database

### Fail to create user when Auth0 is unavailable

**Given** I have valid user information  
**But** the Auth0 service is not responding  
**When** I execute the create user command  
**Then** the operation should fail  
**And** I should receive an error message "Failed to create user"  
**And** no user should be created in the database

### Fail to create user with duplicate email

**Given** a user exists with email "john@email.com"  
**And** I have the following user information:

| field    | value          |
| -------- | -------------- |
| name     | Another        |
| surname  | User           |
| email    | john@email.com |
| password | SecurePass123! |

**When** I execute the create user command  
**Then** the operation should fail  
**And** I should receive an error message "Failed to create user"  
**And** no new user should be created in the database
