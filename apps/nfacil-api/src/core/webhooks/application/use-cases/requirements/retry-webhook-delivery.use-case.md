```gherkin
# language: en
Feature: Webhook Delivery Retry
  As a system component
  I want to retry failed webhook deliveries
  To ensure reliable event notifications

  Background:
    Given a failed delivery attempt for webhook "WH-123"

  Scenario: Retry with exponential backoff
    When processing failed delivery for "WH-123"
    Then schedule a retry with exponential backoff:
      | attempt | max_delay |
      | 1       | 30s       |
      | 2       | 90s       |
      | 3       | 4m        |
      | 4       | 10m       |

  Scenario: Final delivery failure
    Given 4 previous failed attempts for "WH-123"
    When the 5th delivery attempt fails
    Then mark the webhook as failed
    And notify the user via system alerts
    And cease further retry attempts
```
