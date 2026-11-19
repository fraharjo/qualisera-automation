import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
  web: {
    baseUrl: process.env.WEB_BASE_URL || 'https://www.saucedemo.com',
    standardUser: process.env.WEB_STANDARD_USER || 'standard_user',
    standardPassword: process.env.WEB_STANDARD_PASSWORD || 'secret_sauce',
    lockedUser: process.env.WEB_LOCKED_USER || 'locked_out_user',
    problemUser: process.env.WEB_PROBLEM_USER || 'problem_user'
  },
  mobile: {
    standardUser: process.env.MOBILE_STANDARD_USER || 'bob@example.com',
    standardPassword: process.env.MOBILE_STANDARD_PASSWORD || '10203040',
    lockedUser: process.env.MOBILE_LOCKED_USER || 'alice@example.com'
  },
  device: {
    androidDeviceName: process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    androidPlatformVersion: process.env.ANDROID_PLATFORM_VERSION || '12.0',
    appiumHost: process.env.APPIUM_HOST || '127.0.0.1',
    appiumPort: parseInt(process.env.APPIUM_PORT || '4723', 10)
  }
};

export default ENV;
