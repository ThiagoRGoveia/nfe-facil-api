Feature: Credit Top-up
As a user
I want to top up my credits
So I can maintain a sufficient credit balance for operations

Background:
Given I am an authenticated user
And I have a price model assigned
And I have a Stripe customer ID

Scenario: User tops up credits successfully
Given my current credit balance is 100
When I initiate a top-up of 50 credits
And the Stripe payment is successful
Then my credit balance should be 150
And a credit history record should be created with:
| type       | amount | balance_before | balance_after | stripe_operation_id |
| top-up     | 50     | 100            | 150           | stripe_12345        | 