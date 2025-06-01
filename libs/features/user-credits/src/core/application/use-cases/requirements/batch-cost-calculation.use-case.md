# language: en

Feature: Batch Cost Calculation
As a user
I want to calculate the credit cost of a batch process
So I can plan my credit usage accordingly

Background:
Given I am an authenticated user
And I have access to a template with a defined credit cost
And I have a batch process in "created" status

Scenario: Calculate cost for batch with multiple files
Given the template has a credit cost of 5 per file
And the batch contains 3 files
When I request the credit cost for the batch
Then I should receive a total credit cost of 15

Scenario: Calculate cost for empty batch
Given the template has a credit cost of 5 per file
And the batch contains 0 files
When I request the credit cost for the batch
Then I should receive a total credit cost of 0

Scenario: Fail to calculate cost for started batch
Given I have a batch process in "processing" status
When I request the credit cost for the batch
Then the operation should fail
And I should receive an error message "Cannot calculate cost for a batch that has already started"

Scenario: Calculate cost after adding file to batch
Given the template has a credit cost of 5 per file
And the batch initially contains 2 files
When I add another file to the batch
And I request the credit cost for the batch
Then I should receive a total credit cost of 15

Scenario: Calculate cost after removing file from batch
Given the template has a credit cost of 5 per file
And the batch initially contains 3 files
When I remove one file from the batch
And I request the credit cost for the batch
Then I should receive a total credit cost of 10