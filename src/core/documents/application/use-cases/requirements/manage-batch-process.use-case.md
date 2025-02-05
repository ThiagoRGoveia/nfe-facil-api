# Manage Batch Process

## Feature

As a user  
I want to manage my batch process by adding/removing files and controlling its execution  
So that I can process multiple files in a controlled manner

## Background

- Given the application is running
- And the database is available
- And the S3 storage is available

## Scenarios

### Successfully add file to batch process

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "created" status  
**When** I execute the add file command with:

| field       | value                         |
| ----------- | ----------------------------- |
| batch_id    | batch-123                     |
| file        | file-1.pdf                    |
| webhook_url | https://my-webhook.com/file-1 |

**Then** the file should be uploaded to S3  
**And** a new file entry should be created in the batch with:

| field       | value                         |
| ----------- | ----------------------------- |
| id          | {uuid}                        |
| filename    | file-1.pdf                    |
| status      | pending                       |
| webhook_url | https://my-webhook.com/file-1 |

### Successfully remove file from batch process

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "created" status  
**And** the batch has a file with ID "file-123"  
**When** I execute the remove file command with:

| field    | value     |
| -------- | --------- |
| batch_id | batch-123 |
| file_id  | file-123  |

**Then** the file entry should be removed from the batch  
**And** the file should be removed from S3

### Successfully start batch process

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "created" status  
**And** the batch has multiple files added  
**When** I execute the start batch command for "batch-123"  
**Then** the batch status should be updated to "processing"  
**And** parallel processing should be initiated for each file using the process-file feature  
**And** each file should be processed with its configured webhook URL

### Successfully cancel batch process

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "created" status  
**When** I execute the cancel batch command for "batch-123"  
**Then** the batch status should be updated to "cancelled"  
**And** all uploaded files should be removed from S3

### Successfully update batch template

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "created" status  
**And** I have access to template ID "new-template-456"  
**When** I execute the update batch command with:

| field       | value            |
| ----------- | ---------------- |
| batch_id    | batch-123        |
| template_id | new-template-456 |

**Then** the batch template should be updated  
**And** the batch status should remain "created"

### Fail to add file to started batch

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "processing" status  
**When** I execute the add file command with:

| field    | value     |
| -------- | --------- |
| batch_id | batch-123 |
| file     | file.pdf  |

**Then** the operation should fail  
**And** I should receive an error message "Cannot add files to a batch that has already started"

### Fail to remove file from started batch

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "processing" status  
**When** I execute the remove file command with:

| field    | value     |
| -------- | --------- |
| batch_id | batch-123 |
| file_id  | file-123  |

**Then** the operation should fail  
**And** I should receive an error message "Cannot remove files from a batch that has already started"

### Fail to update template of started batch

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "processing" status  
**When** I execute the update batch command with:

| field       | value            |
| ----------- | ---------------- |
| batch_id    | batch-123        |
| template_id | new-template-456 |

**Then** the operation should fail  
**And** I should receive an error message "Cannot update template of a batch that has already started"

### Batch completion with mixed results

**Given** I am an authenticated user  
**And** I own a batch process with ID "batch-123" in "processing" status  
**And** the batch has 3 files being processed  
**When** 2 files complete successfully and 1 fails  
**Then** the batch status should be updated to "partially_completed"  
**And** each file should have its individual status updated accordingly  
**And** each file's webhook should be called with its respective result
