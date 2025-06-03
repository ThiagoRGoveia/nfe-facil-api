Feature: Credit Spending
As a user
I want to spend my credits on operations
So I can perform necessary tasks

Background:
Given I am an authenticated user
And I have a price model assigned

Scenario: User purchases operation with sufficient credits
Given my current credit balance is 200
When I purchase an operation costing 50 credits
Then my credit balance should be 150
And a credit history record should be created with:
| type       | amount | balance_before | balance_after | operation_id |
| purchase   | 50     | 200            | 150           | op_12345     |

Scenario: User attempts purchase with insufficient credits
Given my current credit balance is 20
When I attempt to purchase an operation costing 50 credits
Then the purchase should be rejected
And my credit balance should remain 20
And a failed credit history record should be created with:
| type       | amount | balance_before | balance_after | operation_id |
| purchase   | 50     | 20             | 20            | op_12345     |