# language: en

Feature: Subscription Triggered Top-up
As a system
I want to automatically top up credits based on active subscriptions
So users maintain their subscribed credit balance

Background:
Given I have users with active credit subscriptions
And each subscription has a defined credit amount and frequency

Scenario: Successful subscription top-up
Given a user has an active subscription for 100 credits monthly
And the subscription period has elapsed
When the system processes subscription top-ups ad the start of the day of the next month
Then the user's account should be credited with 100 credits
And a credit history record should be created with:
| type            | amount | balance_before | balance_after | subscription_id |
| subscription    | 100    | {previous}    | {new}         | sub_12345       |

Scenario: Failed subscription top-up
Given a user has an active subscription for 100 credits monthly
And the subscription period has elapsed
When the system processes subscription top-ups
And the Stripe payment fails
Then the user's credit balance should remain unchanged
And a failed credit history record should be created with:
| type            | amount | balance_before | balance_after | subscription_id |
| subscription    | 100    | {previous}    | {previous}    | sub_12345       |

Scenario: Skip top-up for cancelled subscription
Given a user had a subscription that was cancelled
And the subscription period has elapsed
When the system processes subscription top-ups
Then no credits should be added to the user's account
And no credit history record should be created
