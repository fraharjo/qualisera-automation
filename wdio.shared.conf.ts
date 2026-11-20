import './shared/config/env.config';
import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: './tsconfig.json',
      transpileOnly: true
    }
  },

  // ==================
  // Specify Test Files
  // ==================
  specs: [
    './features/**/features/**/*.feature'
  ],
  exclude: [],

  // ============
  // Capabilities
  // ============
  maxInstances: 5,
  capabilities: [],

  // ===================
  // Test Configurations
  // ===================
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // =================
  // Framework Setup
  // =================
  framework: 'cucumber',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: './reports/allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
        useCucumberStepReporter: true
      }
    ]
  ],

  cucumberOpts: {
    require: [
      './shared/steps/**/*.steps.ts',
      './features/**/steps/**/*.steps.ts'
    ],
    backtrace: false,
    requireModule: [],
    dryRun: false,
    failFast: false,
    snippets: true,
    source: true,
    strict: false,
    tags: '@automated and not @manual',
    timeout: 60000,
    ignoreUndefinedDefinitions: false
  },

  // =====
  // Hooks
  // =====
  onPrepare: function () {
    const fs = require('fs');
    const path = require('path');
    const resultsDir = path.join(process.cwd(), 'reports', 'allure-results');
    if (fs.existsSync(resultsDir)) {
      const files = fs.readdirSync(resultsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(resultsDir, file));
          } catch (e) {
            // ignore
          }
        }
      }
      console.log('[WDIO] Cleaned previous Allure results, preserving .gitkeep.');
    }
  },

  afterStep: async function (step, scenario, { error, duration, passed }) {
    if (error) {
      // Auto-capture screenshot on failure and attach to Allure report
      try {
        await browser.takeScreenshot();
      } catch (e) {
        console.warn('Could not take screenshot on step failure:', e);
      }
    }
  },

  onComplete: async function (exitCode, config, capabilities, results) {
    try {
      const allure = require('allure-commandline');
      const { spawn } = require('child_process');

      console.log('\n[WDIO] Generating Allure Report automatically...');
      const generation = allure([
        'generate',
        './reports/allure-results',
        '--clean',
        '-o',
        './reports/allure-report'
      ]);

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[WDIO] Allure report generation timed out.');
          resolve();
        }, 15000);

        generation.on('exit', (code: number) => {
          clearTimeout(timeout);
          if (code === 0) {
            console.log('[WDIO] Allure report successfully generated at ./reports/allure-report');
            console.log('[WDIO] 👉 To view the interactive report dashboard, run: npm run report:open');
            console.log('\n💡 [Qualisera Tip] Want to dispatch this test report to your team?');
            console.log('   • Run: npm run report:email');
            console.log('   • Configure settings interactively: npm run setup:email\n');

            // Auto-dispatch email if policy conditions are met
            const { ENV } = require('./shared/config/env.config');
            if (ENV.email.enabled) {
              const policy = ENV.email.triggerPolicy || 'manual';
              const isCi = process.env.CI === 'true';
              const hasFailure = results && (results.failed > 0);

              let shouldSend = false;
              if (policy === 'always') shouldSend = true;
              else if (policy === 'ci_only' && isCi) shouldSend = true;
              else if (policy === 'on_failure' && hasFailure) shouldSend = true;

              if (shouldSend) {
                console.log(`[WDIO] 📧 Auto-dispatching email report per policy (${policy})...`);
                const { execSync } = require('child_process');
                try {
                  execSync('npx ts-node scripts/send-email-report.ts', { stdio: 'inherit' });
                } catch (e: any) {
                  console.warn('[WDIO] Email auto-dispatch encountered an error:', e.message);
                }
              }
            }
          } else {
            console.warn(`[WDIO] Allure generation exited with code: ${code}`);
          }
          resolve();
        });
      });
    } catch (err) {
      console.error('[WDIO] Failed to auto-generate Allure report:', err);
    }
  }
};
