import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
  // ==========================================
  // Web Environment Configuration
  // ==========================================
  web: {
    baseUrl: process.env.WEB_BASE_URL || 'https://example.com',
    browser: process.env.WEB_BROWSER || 'chrome',
    headless: process.env.HEADLESS !== 'false'
  },

  // ==========================================
  // Android Appium Configuration
  // ==========================================
  android: {
    appPath: process.env.ANDROID_APP_PATH || path.join(process.cwd(), './apps/app.apk'),
    deviceName: process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    platformVersion: process.env.ANDROID_PLATFORM_VERSION || '14.0',
    automationName: process.env.ANDROID_AUTOMATION_NAME || 'UiAutomator2'
  },

  // ==========================================
  // iOS Appium Configuration
  // ==========================================
  ios: {
    appPath: process.env.IOS_APP_PATH || path.join(process.cwd(), './apps/app.ipa'),
    deviceName: process.env.IOS_DEVICE_NAME || 'iPhone 15 Pro',
    platformVersion: process.env.IOS_PLATFORM_VERSION || '17.0',
    automationName: process.env.IOS_AUTOMATION_NAME || 'XCUITest'
  },

  // ==========================================
  // Cross-Platform Test Credentials
  // ==========================================
  credentials: {
    standardUser: process.env.TEST_STANDARD_USER || 'tester@example.com',
    standardPassword: process.env.TEST_STANDARD_PASSWORD || 'Secret123!',
    adminUser: process.env.TEST_ADMIN_USER || 'admin@example.com',
    adminPassword: process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!',
    lockedUser: process.env.TEST_LOCKED_USER || 'locked@example.com'
  },

  // ==========================================
  // Appium Server Connection
  // ==========================================
  appium: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10)
  },

  // ==========================================
  // 📧 Email Reporter (SMTP) Configuration
  // ==========================================
  email: {
    enabled: process.env.EMAIL_REPORT_ENABLED === 'true',
    triggerPolicy: (process.env.EMAIL_TRIGGER_POLICY as 'manual' | 'on_failure' | 'ci_only' | 'always') || 'manual',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"Qualisera QA Automation" <no-reply@qualisera.com>',
    to: process.env.EMAIL_TO || '',
    subject: process.env.EMAIL_SUBJECT || '',
    dashboardUrl: process.env.REPORT_DASHBOARD_URL || ''
  }
};

export default ENV;
