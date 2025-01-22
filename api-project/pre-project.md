**Requirement Gathering Document for Document Processing API**

**Objective**  
This document specifies the requirements for a Document Processing API that uses Large Language Models (LLMs) to extract structured data from files with known templates. The system will be hosted on AWS, follow RESTful principles, use Keycloak for authentication, and support both synchronous and asynchronous processing through queues.

---

**1. Project Identification**

- **Project Name:** Document Processing API
- **Request Date:** Current
- **System Type:** REST API with async processing capabilities

---

**2. Technical Stack**

- **Cloud Platform:** AWS
- **Database:** PostgreSQL
- **Authentication:** Keycloak (OAuth2)
- **Storage:** AWS S3
- **Queue System:** AWS SQS/SNS
- **Processing:** LLM-agnostic integration

---

**3. Core Features**

1. **Template Management**

   - CRUD operations for document templates
   - Support for global and client-specific templates
   - Template metadata storage
   - Process type configuration (LLM, OCR)

2. **File Processing**

   - Synchronous processing with configurable limits
   - Asynchronous processing for bulk operations
   - File validation and storage in S3
   - Configurable file size limits (default 5MB)

3. **Webhook Management**

   - CRUD operations for webhook configurations
   - OAuth2 support for webhook calls
   - Custom header support
   - Processing result notifications

4. **Authentication & Authorization**
   - OAuth2 integration with Keycloak
   - Client credentials flow
   - Client management in database

---

**4. Functional Requirements**

**Template Management:**

- FR01 - System must support CRUD operations for document templates
- FR02 - Templates must be categorized as global or client-specific
- FR03 - Templates must store: owner (if not global), name, creation date, last update date, and process type
- FR04 - System must maintain a separate table for process types (initial types: LLM, OCR)

**File Processing:**

- FR05 - System must accept PDF files for processing
- FR06 - System must validate file size against configurable limit (default 5MB)
- FR07 - System must support synchronous processing with configurable file limit per client (default 1)
- FR08 - System must support asynchronous processing without file count limits
- FR09 - System must store files in S3 and processing results in PostgreSQL
- FR10 - System must track all extraction operations per client

**Webhook Management:**

- FR11 - System must support CRUD operations for webhook configurations
- FR12 - Webhook calls must support OAuth2 authentication
- FR13 - Webhook calls must support custom headers
- FR14 - Webhook notifications must include file reference and extracted data

**Authentication:**

- FR15 - System must integrate with Keycloak for OAuth2 authentication
- FR16 - System must support client credentials flow
- FR17 - System must maintain client information in the database

---

**5. Non-Functional Requirements**

**Performance:**

- NFR01 - System must handle file uploads up to configured size limit
- NFR02 - System must process synchronous requests within acceptable time limits

**Scalability:**

- NFR03 - System must handle multiple concurrent file processing requests
- NFR04 - System must scale based on processing queue size

**Security:**

- NFR05 - All API endpoints must be secured with OAuth2
- NFR06 - File storage must be secure and access-controlled
- NFR07 - Webhook endpoints must support secure communication

**Maintainability:**

- NFR08 - System must be LLM-provider agnostic
- NFR09 - System must be configurable through environment variables

---

**6. Data Structure**

**Template:**

- ID (UUID)
- Name (String)
- Owner ID (UUID, nullable)
- Is Global (Boolean)
- Created At (Timestamp)
- Updated At (Timestamp)
- Process Type ID (UUID)
- Prompt (Text)

**Process Type:**

- ID (UUID)
- Name (String)
- Description (Text)

**Extraction Job:**

- ID (UUID)
- Client ID (UUID)
- Template ID (UUID)
- File Reference (String)
- Status (Enum)
- Created At (Timestamp)
- Completed At (Timestamp)
- Result (JSON)
- Error (Text, nullable)

**Webhook Configuration:**

- ID (UUID)
- Client ID (UUID)
- URL (String)
- Auth Type (Enum)
- Auth Configuration (JSON)
- Headers (JSON)
- Active (Boolean)

---

**7. API Endpoints**

The API will follow RESTful principles with the following main endpoints:

```
Templates:
POST /api/v1/templates
GET /api/v1/templates
GET /api/v1/templates/{id}
PUT /api/v1/templates/{id}
DELETE /api/v1/templates/{id}

Processing:
POST /api/v1/process/sync
POST /api/v1/process/async
GET /api/v1/process/{jobId}

Webhooks:
POST /api/v1/webhooks
GET /api/v1/webhooks
GET /api/v1/webhooks/{id}
PUT /api/v1/webhooks/{id}
DELETE /api/v1/webhooks/{id}
```

---

**8. AWS Infrastructure**

Required AWS services:

- ECS/EKS for container orchestration
- S3 for file storage
- SQS for job queuing
- RDS for PostgreSQL
- Secrets Manager for sensitive configuration

---
