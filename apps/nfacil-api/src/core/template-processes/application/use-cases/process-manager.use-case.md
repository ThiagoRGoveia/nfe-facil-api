# Process Manager

## Feature

As a system component  
I want to manage and execute PDF processing implementations  
So that templates can be validated and documents can be processed

## Background

- Given the process manager is available
- And process implementations are registered

## Scenarios

### Successfully get process metadata DTO

**Given** a process code "invoice-extractor" exists  
**When** I request the metadata DTO for "invoice-extractor"  
**Then** I should receive the process-specific DTO configuration  
**And** it should be usable for template metadata validation

### Successfully get supported output formats

**Given** a process code "invoice-extractor" exists  
**When** I request the supported formats for "invoice-extractor"  
**Then** I should receive a list of supported formats  
**And** each format should implement the standard output interface

### Successfully execute process

**Given** a process code "invoice-extractor" exists  
**When** I execute the process with:

| field         | value                                  |
| ------------- | -------------------------------------- |
| process_code  | invoice-extractor                      |
| file          | valid.pdf                              |
| metadata      | {valid process-specific configuration} |
| output_format | json                                   |

**Then** the process should execute successfully  
**And** return the extracted data in the requested format

### Fail with non-existent process code

**Given** a process code "non-existent" does not exist  
**When** I try to execute the process with:

| field         | value           |
| ------------- | --------------- |
| process_code  | non-existent    |
| file          | valid.pdf       |
| metadata      | {configuration} |
| output_format | json            |

**Then** the operation should fail  
**And** I should receive an error message "Process code not found"

### Fail with unsupported output format

**Given** a process code "invoice-extractor" exists  
**When** I try to execute the process with an unsupported format:

| field         | value                                  |
| ------------- | -------------------------------------- |
| process_code  | invoice-extractor                      |
| file          | valid.pdf                              |
| metadata      | {valid process-specific configuration} |
| output_format | unsupported-format                     |

**Then** the operation should fail  
**And** I should receive an error message "Unsupported output format"

### Successfully handle process errors

**Given** a process code "invoice-extractor" exists  
**When** the process execution fails  
**Then** it should return a standardized error:

| field      | value                     |
| ---------- | ------------------------- |
| error_code | FILE_001                  |
| message    | File Corrupted            |
| suggestion | Verify PDF file integrity |
