Feature: Credit Subscriptions
As a user
I want to manage credit subscriptions
So I can maintain a consistent credit balance

Background:
Given I am an authenticated user
And I have a valid payment method on file

Scenario: User subscribes to credit plan
Given I have no active subscription
When I subscribe to a credit plan
Then a subscription record should be created
And the subscription status should be active

Scenario: User cancels subscription
Given I have an active subscription
When I cancel my subscription
Then the subscription status should be inactive
And the cancellation should be processed in Stripe 