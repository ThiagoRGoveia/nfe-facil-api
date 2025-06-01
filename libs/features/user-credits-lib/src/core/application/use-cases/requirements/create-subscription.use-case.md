# language: en

Feature: Create Credit Subscription
As a user
I want to create a credit subscription
So I can maintain a consistent credit balance

Background:
Given I am an authenticated user
And I have a valid payment method on file

Scenario: User subscribes to credit plan
Given I have no active subscription
When I subscribe to a credit plan
Then a subscription record should be created
And the subscription status should be active
And the subscription should be processed in Stripe 