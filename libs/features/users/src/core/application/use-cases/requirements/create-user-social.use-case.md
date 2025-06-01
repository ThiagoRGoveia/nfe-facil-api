# Create Social User

## Feature

As a social media user  
I want to create an account using my social media credentials  
So that I can access the system without creating a new password

## Background

- Given the application is running
- And the Auth0 service is available

## Scenarios

### Successfully create user with social media account

**Given** a user has authenticated with Auth0  
**And** their Auth0 ID is "auth0|123456789"  
**And** their Auth0 profile contains:

| field       | value          |
| ----------- | -------------- |
| given_name  | John           |
| family_name | Doe            |
| email       | john@email.com |

**When** I execute the create social user command  
**Then** a new user should be created with:

| field    | value          |
| -------- | -------------- | --------- |
| name     | John           |
| surname  | Doe            |
| email    | john@email.com |
| auth0Id  | auth0          | 123456789 |
| role     | CUSTOMER       |
| credits  | 0              |
| isSocial | true           |

**And** the user should have a generated client ID  
**And** the user should have a generated client secret

### Create user with minimal Auth0 profile

**Given** a user has authenticated with Auth0  
**And** their Auth0 ID is "auth0|987654321"  
**And** their Auth0 profile contains only:

| field | value          |
| ----- | -------------- |
| name  | John Smith     |
| email | john@email.com |

**When** I execute the create social user command  
**Then** a new user should be created with:

| field    | value          |
| -------- | -------------- | --------- |
| name     | John Smith     |
| email    | john@email.com |
| auth0Id  | auth0          | 987654321 |
| role     | CUSTOMER       |
| isSocial | true           |

### Fail to create user due to Auth0 service error

**Given** a user has authenticated with Auth0  
**And** their Auth0 ID is "auth0|123456789"  
**But** the Auth0 service is not responding  
**When** I execute the create social user command  
**Then** the operation should fail  
**And** I should receive an error message "Failed to create social user"  
**And** no user should be created in the database
