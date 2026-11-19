import { Given, Then } from '@cucumber/cucumber';
import sampleScreen from '../pages/sample.screen';

Given('the user launches the application', async () => {
  // Baseline precondition
});

Then('the main application container should be displayed', async () => {
  const isVisible = await sampleScreen.isMainContainerDisplayed();
  expect(isVisible).toBe(true);
});
