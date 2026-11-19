import path from 'path';
import { config as sharedConfig } from './wdio.shared.conf';

const APP_ID = 'com.bmolab.kotakin';

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  maxInstances: 1,
  port: 4723,
  services: [
    [
      'appium',
      {
        args: {
          relaxedSecurity: true
        },
        logPath: './reports/'
      }
    ]
  ],
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android Emulator',
      'appium:app': process.env.ANDROID_APP_PATH || path.join(process.cwd(), './apps/kotakin.apk'),
      'appium:appWaitActivity': '*',
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240
    }
  ],

  // ========================================================
  // Option 1: Hard Reset / Relaunch App Hooks for Isolation
  // ========================================================
  beforeScenario: async function (world: any) {
    try {
      const isFeatureOnboarding = world.pickle?.tags?.some((tag: any) => tag.name === '@feature-onboarding');
      if (isFeatureOnboarding) {
        // Clear app data so onboarding walkthrough is always shown from fresh state
        await browser.execute('mobile: clearApp', { appId: APP_ID });
        await browser.activateApp(APP_ID);
        await browser.pause(1000);
      }

      const scenarioName = world.pickle?.name || '';
      const isPermissionScenario =
        world.pickle?.tags?.some((tag: any) => tag.name === '@permission') ||
        scenarioName.includes('camera permission') ||
        scenarioName.includes('permission requirement');
      if (isPermissionScenario) {
        await browser.execute('mobile: shell', {
          command: 'pm',
          args: ['revoke', APP_ID, 'android.permission.CAMERA']
        });
        await browser.terminateApp(APP_ID, {});
        await browser.activateApp(APP_ID);
        await browser.pause(1000);
      }
    } catch (err) {
      console.warn('beforeScenario hook error:', err);
    }
  },

  afterScenario: async function (world: any) {
    try {
      const scenarioName = world.pickle?.name || '';
      const isPermissionScenario =
        world.pickle?.tags?.some((tag: any) => tag.name === '@permission') ||
        scenarioName.includes('camera permission') ||
        scenarioName.includes('permission requirement');
      if (isPermissionScenario) {
        await browser.execute('mobile: shell', {
          command: 'pm',
          args: ['grant', APP_ID, 'android.permission.CAMERA']
        });
      }

      const isFeatureOnboarding = world.pickle?.tags?.some((tag: any) => tag.name === '@feature-onboarding');
      if (isFeatureOnboarding) {
        await browser.execute('mobile: clearApp', { appId: APP_ID });
        await browser.activateApp(APP_ID);
      } else {
        // Relaunch app to clear any open modals, dropdowns, or viewfinders back to My Stash
        await browser.terminateApp(APP_ID, {});
        await browser.activateApp(APP_ID);
      }
      await browser.pause(1000);
    } catch (err) {
      console.warn('afterScenario relaunch error:', err);
    }
  }
};

