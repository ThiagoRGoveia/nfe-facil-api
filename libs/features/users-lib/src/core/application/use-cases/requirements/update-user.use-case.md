# Update User Information

## Feature

As a registered user  
I want to update my profile information  
So that I can keep my details current

## Background

- Given the application is running
- And the database is available

## Scenarios

### Successfully update user information

**Given** a user exists with ID 1 and current information:

| field   | value          |
| ------- | -------------- |
| name    | John           |
| surname | Doe            |
| email   | john@email.com |

**When** I execute the update user command with new information:

| field   | value  |
| ------- | ------ |
| name    | Johnny |
| surname | Smith  |

**Then** the user information should be updated in the database  
**And** the updated user should have:

| field   | value          |
| ------- | -------------- |
| name    | Johnny         |
| surname | Smith          |
| email   | john@email.com |

### Fail to update non-existent user

**Given** no user exists with ID 999  
**When** I execute the update user command for ID 999 with:

| field | value  |
| ----- | ------ |
| name  | Johnny |

**Then** the operation should fail  
**And** I should receive an error message "User with id 999 not found"  
**And** no changes should be made to the database

### Update user with partial information

**Given** a user exists with ID 1 and current information:

| field   | value          |
| ------- | -------------- |
| name    | John           |
| surname | Doe            |
| email   | john@email.com |

**When** I execute the update user command with:

| field | value  |
| ----- | ------ |
| name  | Johnny |

**Then** only the name should be updated in the database  
**And** the user should have:

| field   | value          |
| ------- | -------------- |
| name    | Johnny         |
| surname | Doe            |
| email   | john@email.com |

### Fail to update user due to database error

**Given** a user exists with ID 1  
**But** the database connection is lost  
**When** I execute the update user command with:

| field | value  |
| ----- | ------ |
| name  | Johnny |

**Then** the operation should fail  
**And** I should receive an error message "Failed to update user in database"  
**And** the user information should remain unchanged
