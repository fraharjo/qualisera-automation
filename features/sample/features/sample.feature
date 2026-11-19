@feature-sample @REQ-SMP-101
Feature: Sample Feature Verification
  As a Qualisera user
  I want to verify the automation setup works properly
  So that I have a reference blueprint for creating new test suites

  @automated @smoke @android @positive @AC-01
  Scenario: Successfully launch application and verify initial screen
    Given the user launches the application
    Then the main application container should be displayed
