# Create Batch Process

## Feature

As a user  
I want to create a batch process for multiple PDF documents  
So that I can process multiple files using the same template configuration

## Background

- Given the application is running
- And the database is available
- And the S3 storage is available

## Scenarios

### Successfully create empty batch process

**Given** I am an authenticated user  
**And** I have access to template ID "template-123"  
**When** I execute the create batch process command with:

| field       | value        |
| ----------- | ------------ |
| template_id | template-123 |

**Then** a new batch process should be created in the database with:

| field       | value          |
| ----------- | -------------- |
| id          | {uuid}         |
| template_id | template-123   |
| status      | created        |
| owner       | {current_user} |

### Successfully create batch process with zip file

**Given** I am an authenticated user  
**And** I have access to template ID "template-123"  
**And** I have a zip file containing PDF files:

- invoice1.pdf
- invoice2.pdf
- invoice3.pdf  
  **When** I execute the create batch process command with:

| field       | value        |
| ----------- | ------------ |
| template_id | template-123 |
| file        | invoices.zip |

**Then** a new batch process should be created in the database with:

| field       | value          |
| ----------- | -------------- |
| id          | {uuid}         |
| template_id | template-123   |
| status      | created        |
| owner       | {current_user} |

**And** each PDF from the zip should be added to the batch:

| field    | value        | status  |
| -------- | ------------ | ------- |
| id       | {uuid-1}     | pending |
| filename | invoice1.pdf | pending |
| id       | {uuid-2}     | pending |
| filename | invoice2.pdf | pending |
| id       | {uuid-3}     | pending |
| filename | invoice3.pdf | pending |

**And** all files should be extracted and uploaded to S3

### Fail to create batch process with invalid zip file

**Given** I am an authenticated user  
**And** I have access to template ID "template-123"  
**When** I execute the create batch process command with a corrupted zip file:

| field       | value         |
| ----------- | ------------- |
| template_id | template-123  |
| file        | corrupted.zip |

**Then** the operation should fail  
**And** I should receive an error message "Invalid zip file"  
**And** no batch process should be created

### Fail to create batch process with non-PDF files in zip

**Given** I am an authenticated user  
**And** I have access to template ID "template-123"  
**And** I have a zip file containing mixed files:

- document.pdf
- image.jpg
- text.txt  
  **When** I execute the create batch process command with:

| field       | value        |
| ----------- | ------------ |
| template_id | template-123 |
| file        | mixed.zip    |

**Then** the operation should fail  
**And** I should receive an error message "Zip file contains non-PDF files"  
**And** no batch process should be created

### Fail to create batch process with non-existent template

**Given** I am an authenticated user  
**When** I execute the create batch process command with:

| field       | value           |
| ----------- | --------------- |
| template_id | non-existent-id |

**Then** the operation should fail  
**And** I should receive an error message "Template not found"  
**And** no batch process should be created

### Fail to create batch process with inaccessible template

**Given** I am an authenticated user  
**And** template ID "template-456" exists but belongs to another user  
**When** I execute the create batch process command with:

| field       | value        |
| ----------- | ------------ |
| template_id | template-456 |

**Then** the operation should fail  
**And** I should receive an error message "You don't have access to this template"  
**And** no batch process should be created
