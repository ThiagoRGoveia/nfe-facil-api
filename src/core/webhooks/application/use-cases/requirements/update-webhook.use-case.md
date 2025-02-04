```gherkin
# language: en
Feature: Webhook Update
  As a system user
  I want to update my existing webhooks that I own
  So I can modify their configuration as needed

  Background:
    Given I have an existing webhook with ID "WH-123"
      | field       | value                  |
      | target_url  | https://old.example.com |
      | auth_type   | basic                  |
      | auth_config | {"username": "olduser"} |
      And I am the owner of the webhook

  Scenario: Update webhook URL
    When I update webhook "WH-123" with:
      | target_url | https://new.example.com |
    Then the webhook should have the new URL
    And encryption status should be maintained

  Scenario: Update authentication configuration
    When I update webhook "WH-123" with:
      | auth_type   | oauth2                 |
      | auth_config | {"client_id": "new123", "client_secret": "newsec"} |
    Then the auth configuration should be encrypted
    And previous credentials should be invalidated

  Scenario: Handle non-existent webhook
    When I try to update webhook "WH-999"
    Then the operation should fail with "Webhook not found"
```
