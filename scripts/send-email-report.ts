import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { ENV } from '../shared/config/env.config';

interface AllureSummary {
  reportName: string;
  statistic: {
    failed: number;
    broken: number;
    skipped: number;
    passed: number;
    unknown: number;
    total: number;
  };
  time?: {
    start?: number;
    stop?: number;
    duration?: number;
  };
}

interface FailedScenario {
  name: string;
  status: string;
  message?: string;
}

/**
 * Format milliseconds into human readable string
 */
function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return '0s';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Read and parse Allure report summary data
 */
function getAllureSummary(): AllureSummary {
  const summaryPath = path.join(process.cwd(), 'reports', 'allure-report', 'widgets', 'summary.json');
  if (fs.existsSync(summaryPath)) {
    try {
      const content = fs.readFileSync(summaryPath, 'utf-8');
      return JSON.parse(content) as AllureSummary;
    } catch (e) {
      console.warn('[EmailReporter] Failed to read summary.json, using fallback.');
    }
  }

  return {
    reportName: 'Allure Report',
    statistic: { failed: 0, broken: 0, skipped: 0, passed: 0, unknown: 0, total: 0 },
    time: { duration: 0 }
  };
}

/**
 * Extract failed scenarios if available in allure-report/data/test-cases
 */
function getFailedScenarios(): FailedScenario[] {
  const failed: FailedScenario[] = [];
  const testCasesDir = path.join(process.cwd(), 'reports', 'allure-report', 'data', 'test-cases');
  if (!fs.existsSync(testCasesDir)) return failed;

  try {
    const files = fs.readdirSync(testCasesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(testCasesDir, file), 'utf-8');
        const testCase = JSON.parse(content);
        if (testCase.status === 'failed' || testCase.status === 'broken') {
          failed.push({
            name: testCase.name || 'Unnamed Scenario',
            status: testCase.status,
            message: testCase.statusMessage || testCase.statusTrace?.split('\n')[0] || 'Assertion or runtime failure'
          });
          if (failed.length >= 5) break; // Limit top 5
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return failed;
}

/**
 * Build professional HTML email template
 */
function buildHtmlTemplate(summary: AllureSummary, failedScenarios: FailedScenario[]): string {
  const { failed, broken, skipped, passed, total } = summary.statistic;
  const isSuccess = total > 0 && failed === 0 && broken === 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const durationStr = formatDuration(summary.time?.duration);

  const statusColor = isSuccess ? '#10b981' : (total === 0 ? '#6b7280' : '#ef4444');
  const statusBadge = isSuccess ? 'PASSED' : (total === 0 ? 'NO TESTS' : 'FAILED');
  const statusEmoji = isSuccess ? '✅' : (total === 0 ? 'ℹ️' : '❌');

  const dashboardUrl = ENV.email.dashboardUrl || 'http://localhost:49796';

  let failedSectionHtml = '';
  if (failedScenarios.length > 0) {
    const items = failedScenarios.map(s => `
      <tr style="border-bottom: 1px solid #fee2e2;">
        <td style="padding: 10px 12px; font-weight: 600; color: #991b1b; font-size: 13px;">${s.name}</td>
        <td style="padding: 10px 12px; text-align: center;">
          <span style="background-color: #fee2e2; color: #b91c1c; font-size: 11px; padding: 3px 8px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
            ${s.status}
          </span>
        </td>
        <td style="padding: 10px 12px; color: #6b7280; font-size: 12px; font-family: monospace;">${s.message}</td>
      </tr>
    `).join('');

    failedSectionHtml = `
      <div style="margin-top: 24px;">
        <h3 style="color: #b91c1c; font-size: 14px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
          ⚠️ Top Failed Scenarios (${failedScenarios.length})
        </h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #fffaf0; border: 1px solid #fecaca; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #fef2f2; text-align: left; font-size: 12px; color: #991b1b;">
              <th style="padding: 10px 12px;">Scenario</th>
              <th style="padding: 10px 12px; text-align: center;">Status</th>
              <th style="padding: 10px 12px;">Error Details</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Qualisera Automation Test Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Top Brand Header -->
    <div style="background-color: #1e293b; padding: 20px 24px; color: #ffffff;">
      <table style="width: 100%;">
        <tr>
          <td>
            <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">QUALISERA AUTOMATION</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Agentic Multi-Platform Quality Assurance Report</p>
          </td>
          <td style="text-align: right;">
            <span style="display: inline-block; background-color: ${statusColor}; color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 20px;">
              ${statusEmoji} ${statusBadge}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px;">
      
      <!-- Execution Summary KPIs -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 20px;">
        <tr>
          <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 22px; font-weight: 800; color: #1e293b;">${total}</div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 4px;">Total Tests</div>
          </td>
          <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 22px; font-weight: 800; color: #16a34a;">${passed}</div>
            <div style="font-size: 11px; font-weight: 600; color: #15803d; text-transform: uppercase; margin-top: 4px;">Passed</div>
          </td>
          <td style="background-color: ${failed > 0 ? '#fef2f2' : '#f8fafc'}; border: 1px solid ${failed > 0 ? '#fecaca' : '#e2e8f0'}; border-radius: 8px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 22px; font-weight: 800; color: ${failed > 0 ? '#dc2626' : '#64748b'};">${failed + broken}</div>
            <div style="font-size: 11px; font-weight: 600; color: ${failed > 0 ? '#b91c1c' : '#64748b'}; text-transform: uppercase; margin-top: 4px;">Failed / Broken</div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 22px; font-weight: 800; color: #ca8a04;">${skipped}</div>
            <div style="font-size: 11px; font-weight: 600; color: #854d0e; text-transform: uppercase; margin-top: 4px;">Skipped</div>
          </td>
          <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 22px; font-weight: 800; color: #2563eb;">${passRate}%</div>
            <div style="font-size: 11px; font-weight: 600; color: #1d4ed8; text-transform: uppercase; margin-top: 4px;">Pass Rate</div>
          </td>
          <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 22px; font-weight: 800; color: #475569;">${durationStr}</div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 4px;">Duration</div>
          </td>
        </tr>
      </table>

      <!-- Meta Information Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; width: 140px;">Execution Date:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${new Date().toLocaleString('id-ID', { timeZoneName: 'short' })}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b;">Target Environment:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${ENV.web.baseUrl}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b;">Browser / Runner:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${ENV.web.browser} (Headless: ${ENV.web.headless})</td>
        </tr>
      </table>

      ${failedSectionHtml}

      <!-- CTA Button to Allure Dashboard -->
      <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
          📊 Open Interactive Allure Report
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      This email was generated automatically by Qualisera Agentic Test Automation Framework.<br>
      Please do not reply directly to this automated email.
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Main execution function
 */
async function main() {
  console.log('====================================================');
  console.log('🚀 Qualisera Automated Email Report Dispatcher');
  console.log('====================================================');

  const summary = getAllureSummary();
  const failedScenarios = getFailedScenarios();
  const htmlContent = buildHtmlTemplate(summary, failedScenarios);

  const previewPath = path.join(process.cwd(), 'reports', 'email-preview.html');
  fs.writeFileSync(previewPath, htmlContent, 'utf-8');
  console.log(`[EmailReporter] 📄 Email HTML preview generated at:\n  -> ${previewPath}`);

  const isSuccess = summary.statistic.total > 0 && summary.statistic.failed === 0 && summary.statistic.broken === 0;
  const statusStr = isSuccess ? 'PASSED' : (summary.statistic.total === 0 ? 'NO TESTS' : 'FAILED');
  const defaultSubject = `[${statusStr}] Qualisera Automation Test Report - ${new Date().toLocaleDateString('id-ID')}`;
  const subject = ENV.email.subject || defaultSubject;

  const recipients = ENV.email.to;
  const isSmtpConfigured = !!(ENV.email.user && ENV.email.pass && recipients);

  if (!isSmtpConfigured || process.argv.includes('--dry-run')) {
    console.log('\n[EmailReporter] ℹ️ DRY RUN / PREVIEW MODE:');
    if (!isSmtpConfigured) {
      console.log('  SMTP credentials (SMTP_USER, SMTP_PASS, EMAIL_TO) are not yet configured in .env.');
    } else {
      console.log('  Executed with --dry-run flag.');
    }
    console.log(`  Subject   : ${subject}`);
    console.log(`  Target To : ${recipients || '(none specified)'}`);
    console.log(`  Pass Rate : ${summary.statistic.total > 0 ? Math.round((summary.statistic.passed / summary.statistic.total) * 100) : 0}% (${summary.statistic.passed}/${summary.statistic.total})`);
    console.log(`  Duration  : ${formatDuration(summary.time?.duration)}`);
    console.log('  👉 To send real emails, set EMAIL_TO, SMTP_USER, and SMTP_PASS in .env and run again.\n');
    return;
  }

  console.log(`[EmailReporter] Connecting to SMTP server ${ENV.email.host}:${ENV.email.port}...`);
  const transporter = nodemailer.createTransport({
    host: ENV.email.host,
    port: ENV.email.port,
    secure: ENV.email.secure,
    auth: {
      user: ENV.email.user,
      pass: ENV.email.pass
    }
  });

  try {
    const info = await transporter.sendMail({
      from: ENV.email.from,
      to: recipients,
      subject: subject,
      html: htmlContent
    });

    console.log('====================================================');
    console.log('✅ Email report successfully sent!');
    console.log(`   Message ID : ${info.messageId}`);
    console.log(`   Recipients : ${recipients}`);
    console.log(`   Subject    : ${subject}`);
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ [EmailReporter] Failed to send email via SMTP:', err.message);
  }
}

main().catch((err) => {
  console.error('[EmailReporter] Unexpected error:', err);
  process.exit(1);
});
