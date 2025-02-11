```gherkin
# language: en
Feature: Webhook Deletion
  As a system user
  I want to delete existing webhooks that I own
  So I can stop receiving unwanted notifications

  Background:
    Given I have an existing webhook with ID "WH-123"
    And I am the owner of the webhook
  Scenario: Delete existing webhook
    When I delete webhook "WH-123"
    Then the webhook should be removed from the system
    And any pending deliveries should be cancelled

  Scenario: Delete non-existent webhook
    When I try to delete webhook "WH-999"
    Then the operation should fail with "Webhook not found"

  Scenario: Prevent duplicate deletions
    Given I have deleted webhook "WH-123"
    When I try to delete webhook "WH-123" again
    Then the operation should fail with "Webhook not found"
```
