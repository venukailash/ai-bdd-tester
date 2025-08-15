Feature: Verify Weather Panel displays forecast

Given I navigate to website yahoo.com
And I verify the homepage has a weather section
And the weather section should display forecast for today and next 3 days
The forecast should contain high and low temperature values