# language: en

Feature: Cancel Credit Subscription
As a user
I want to cancel my credit subscription
So I can stop automatic credit top-ups

Background:
Given I am an authenticated user
And I have an active subscription

Scenario: User cancels subscription
Given I have an active subscription
When I cancel my subscription
Then the subscription status should be inactive
And the cancellation should be processed in Stripe 