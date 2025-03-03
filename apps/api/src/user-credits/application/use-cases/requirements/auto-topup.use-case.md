Feature: Auto Top-up Configuration
As a user
I want to configure auto top-up settings
So my credits are automatically replenished when low

Background:
Given I am an authenticated user
And I have a valid payment method on file

Scenario: User configures auto top-up
Given I have no auto top-up configured
When I set up auto top-up with:
| threshold | amount |
| 50        | 100    |
Then my auto top-up settings should be saved
And the settings should be:
| threshold | amount |
| 50        | 100    |

Scenario: Auto top-up triggers
Given my current credit balance is 40
And I have auto top-up configured with:
| threshold | amount |
| 50        | 100    |
When I perform an operation that reduces my balance to 30
Then an automatic top-up of 100 credits should be initiated
And my final credit balance should be 130
And a credit history record should be created for the auto top-up 