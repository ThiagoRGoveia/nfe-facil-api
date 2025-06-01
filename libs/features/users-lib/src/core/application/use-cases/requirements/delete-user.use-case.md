# Delete User

## Feature

As a system administrator  
I want to delete user accounts  
So that I can remove users who no longer need access to the system

## Background

- Given the application is running
- And the database is available

## Scenarios

### Successfully delete existing user

**Given** a user exists with ID 1  
**When** I execute the delete user command  
**Then** the user should be removed from the database  
**And** the operation should complete successfully  
**And** the deletion should be logged

### Attempt to delete non-existent user

**Given** no user exists with ID 999  
**When** I execute the delete user command for user 999  
**Then** the operation should complete without errors  
**And** no changes should be made to the database

### Fail to delete user due to database error

**Given** a user exists with ID 1  
**But** the database connection is lost  
**When** I execute the delete user command  
**Then** the operation should fail  
**And** I should receive an error message "Failed to delete user from database"  
**And** the user should still exist in the database

### Delete user with associated data

**Given** a user exists with ID 1  
**And** the user has associated data in the system  
**When** I execute the delete user command  
**Then** the user should be removed from the database  
**And** all associated user data should be removed  
**And** the operation should complete successfully
