# Update User Password

## Feature

As a registered user  
I want to update my password  
So that I can maintain the security of my account

## Background

- Given the application is running
- And the Auth0 service is available

## Scenarios

### Successfully update user password

**Given** a user exists with ID 1  
**And** they are authenticated in Auth0  
**When** I execute the update password command with:

| field       | value         |
| ----------- | ------------- |
| newPassword | NewSecure123! |

**Then** the password should be updated in Auth0  
**And** the operation should return true  
**And** the user should be able to login with the new password

### Fail to update password for non-existent user

**Given** no user exists with ID 999  
**When** I execute the update password command for user 999 with:

| field       | value         |
| ----------- | ------------- |
| newPassword | NewSecure123! |

**Then** the operation should fail  
**And** I should receive an error message "User not found"  
**And** no password should be updated in Auth0

### Fail to update password when Auth0 is unavailable

**Given** a user exists with ID 1  
**But** the Auth0 service is not responding  
**When** I execute the update password command with:

| field       | value         |
| ----------- | ------------- |
| newPassword | NewSecure123! |

**Then** the operation should fail  
**And** I should receive an error message "Failed to update password"  
**And** the user's password should remain unchanged

### Fail to update password with invalid format

**Given** a user exists with ID 1  
**When** I execute the update password command with:

| field       | value |
| ----------- | ----- |
| newPassword | weak  |

**Then** the operation should fail  
**And** I should receive an error message "Failed to update password"  
**And** the user's password should remain unchanged
