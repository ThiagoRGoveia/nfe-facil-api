# language: en

Feature: Webhook Creation
As a system user
I want to create webhooks for specific events
So I can receive notifications when events occur

Background:
Given I am an authenticated user
And the following event types exist:
| event_name | description |
| document.processed | Document processing completed |
| batch.completed | Batch processing finished |

Scenario: Create webhook with Basic Auth
When I create a webhook with:
| name | Doc Processor Notifier |
| target_url | https://myapi.com/hooks |
| event_type | document.processed |
| auth_type | basic |
| auth_config | {"username": "user1", "password": "pass123"} |
Then the webhook should be stored with encrypted credentials
And the creation date should be recorded

Scenario: Create webhook with OAuth2 Client Credentials
When I create a webhook with:
| name | Batch Notifier |
| target_url | https://batch.example.com |
| event_type | batch.completed |
| auth_type | oauth2 |
| auth_config | {"client_id": "abc123", "client_secret": "sec456", "token_url": "https://auth.example.com/token"} |
Then the webhook should be stored with encrypted credentials

Scenario: Prevent HTTP in production
Given the system is running in production environment
When I try to create a webhook with URL "http://insecure.example.com"
Then the creation should be rejected with error "HTTPS required in production"

Scenario: Create webhook with custom headers
When I create a webhook with:
| name | Custom Header Notifier |
| target_url | https://myapi.com/hooks |
| event_type | document.processed |
| headers | {"X-Custom-Header": "my-value"} |
Then the webhook should be stored with the custom headers
