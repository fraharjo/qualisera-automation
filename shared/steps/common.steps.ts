import { Given, When, Then } from '@wdio/cucumber-framework';

Given('the user opens the web application', async () => {
  if (!browser.isMobile) {
    await browser.url('/');
  }
});

Then('the user waits for {int} seconds', async (seconds: number) => {
  await browser.pause(seconds * 1000);
});

// Legacy / localized aliases
Given('User membuka aplikasi', async () => {
  if (!browser.isMobile) {
    await browser.url('/');
  }
});

Then('User menunggu selama {int} detik', async (detik: number) => {
  await browser.pause(detik * 1000);
});
