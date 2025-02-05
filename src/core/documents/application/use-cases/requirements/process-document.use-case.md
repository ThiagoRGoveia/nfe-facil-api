# Process File

## Feature

As a user  
I want to process a PDF file using a template  
So that I can extract structured data according to predefined rules

## Background

- Given the application is running
- And the database is available
- And the S3 storage is available

## Scenarios

### Successfully process file with webhook notification

**Given** I am an authenticated user  
**And** I have access to template ID "template-123" with configuration:

| field         | value                                  |
| ------------- | -------------------------------------- |
| name          | Invoice Template                       |
| process_code  | invoice-extractor                      |
| metadata      | {"fields": ["date", "total", "items"]} |
| output_format | json                                   |

**When** I execute the process file command with:

| field       | value                          |
| ----------- | ------------------------------ |
| template_id | template-123                   |
| file        | invoice.pdf                    |
| webhook_url | https://my-service.com/webhook |

**Then** a new file process should be created with status "pending"  
**And** the PDF should be uploaded to S3  
**And** the processing should be initiated asynchronously  
**And** when processing completes:

- The extracted data should be saved to S3
- The process status should be updated to "completed"
- A webhook notification should be sent with:
  - Process ID
  - Filename: "invoice.pdf"
  - Extracted data in JSON format

### Successfully process file without webhook

**Given** I am an authenticated user  
**And** I have access to template ID "template-123"  
**When** I execute the process file command with:

| field       | value        |
| ----------- | ------------ |
| template_id | template-123 |
| file        | invoice.pdf  |

**Then** a new file process should be created with status "pending"  
**And** the PDF should be uploaded to S3  
**And** the processing should be initiated asynchronously  
**And** when processing completes:

- The extracted data should be saved to S3
- The process status should be updated to "completed"

### Failed processing with template incompatibility

**Given** I am an authenticated user  
**And** I have access to template ID "template-123"  
**When** I execute the process file command with an incompatible PDF:

| field       | value         |
| ----------- | ------------- |
| template_id | template-123  |
| file        | different.pdf |

**Then** a new file process should be created with status "pending"  
**And** the PDF should be uploaded to S3  
**And** when the processing fails:

- The process status should be updated to "failed"
- The error details should be stored in the database
- If a webhook URL was provided, a failure notification should be sent

### Fail to process with non-existent template

**Given** I am an authenticated user  
**When** I execute the process file command with:

| field       | value           |
| ----------- | --------------- |
| template_id | non-existent-id |
| file        | invoice.pdf     |

**Then** the operation should fail immediately  
**And** I should receive an error message "Template not found"  
**And** no file process should be created  
**And** the PDF should not be uploaded to S3

### Fail to process with inaccessible template

**Given** I am an authenticated user  
**And** template ID "template-456" exists but belongs to another user  
**When** I execute the process file command with:

| field       | value        |
| ----------- | ------------ |
| template_id | template-456 |
| file        | invoice.pdf  |

**Then** the operation should fail immediately  
**And** I should receive an error message "You don't have access to this template"  
**And** no file process should be created  
**And** the PDF should not be uploaded to S3

### Failed processing with S3 storage error

**Given** I am an authenticated user  
**And** I have access to template ID "template-123"  
**But** the S3 storage is not responding  
**When** I execute the process file command with:

| field       | value        |
| ----------- | ------------ |
| template_id | template-123 |
| file        | invoice.pdf  |

**Then** the operation should fail  
**And** I should receive an error message "Failed to store file"  
**And** the error details should be stored in the database  
**And** if a webhook URL was provided, a failure notification should be sent
