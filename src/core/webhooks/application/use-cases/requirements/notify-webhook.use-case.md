```gherkin
# language: en
Feature: Webhook Notification
  As a system component
  I want to notify registered webhooks of events
  So users receive timely updates
  Exists an enum of event types

  Background:
    Given the following webhooks exist:
      | user | event_type       | target_url             | status   |
      | 123  | document.processed | https://hook1.example | active   |
      | 456  | batch.completed  | https://hook2.example  | inactive |

  Scenario: Deliver event notification
    When a "document.processed" event occurs for user 123
    Then the system should attempt to deliver to https://hook1.example
    And the request should include:
      | header          | value                |
      | Content-Type    | application/json     |
    And the payload should match the event schema
    And mark the delivery as successful

  Scenario: Ignore inactive webhooks
    When a "batch.completed" event occurs for user 456
    Then no notification should be sent to https://hook2.example
```
