import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

interface EmailSetupAnswers {
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
  policy: 'manual' | 'on_failure' | 'ci_only' | 'always';
  dashboardUrl: string;
}

/**
 * Parse existing .env file into key-value map and preserve raw lines
 */
function readEnvFile(envPath: string): { envMap: Map<string, string>; rawLines: string[] } {
  const envMap = new Map<string, string>();
  let rawLines: string[] = [];

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    rawLines = content.split('\n');
    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envMap.set(key, val);
      }
    }
  }

  return { envMap, rawLines };
}

/**
 * Save updated environment variables back to .env
 */
function saveEnvFile(envPath: string, updates: Record<string, string>): void {
  let existingContent = '';
  if (fs.existsSync(envPath)) {
    existingContent = fs.readFileSync(envPath, 'utf-8');
  } else {
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      existingContent = fs.readFileSync(examplePath, 'utf-8');
    }
  }

  let lines = existingContent ? existingContent.split('\n') : [];
  const handledKeys = new Set<string>();

  // Replace existing lines
  lines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      if (key in updates) {
        handledKeys.add(key);
        return `${key}="${updates[key]}"`;
      }
    }
    return line;
  });

  // Append new keys if not already replaced
  const remainingKeys = Object.keys(updates).filter((k) => !handledKeys.has(k));
  if (remainingKeys.length > 0) {
    lines.push('\n# ==========================================');
    lines.push('# 📧 Email Reporter Settings (Auto-Configured)');
    lines.push('# ==========================================');
    for (const key of remainingKeys) {
      lines.push(`${key}="${updates[key]}"`);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n').trim() + '\n', 'utf-8');
}

async function runWizard() {
  const rl = readline.createInterface({ input, output });

  console.log('\n=============================================================');
  console.log('✉️   QUALISERA AUTOMATION - EMAIL REPORTER SETUP WIZARD');
  console.log('=============================================================');
  console.log('Wizard ini akan memandu kamu mengatur pengiriman test report ke email.');
  console.log('Semua konfigurasi akan otomatis tersimpan dengan aman di file .env.\n');

  try {
    // 1. Choose Provider
    console.log('Pilih penyedia email (SMTP Provider):');
    console.log('  1) Gmail / Google Workspace (smtp.gmail.com)');
    console.log('  2) Microsoft Outlook / Office 365 (smtp.office365.com)');
    console.log('  3) Custom SMTP Server (SendGrid, AWS SES, Mailtrap, internal company)\n');

    const providerChoice = (await rl.question('Pilihan [1/2/3] (default: 1): ')).trim() || '1';

    let host = 'smtp.gmail.com';
    let port = 587;
    let secure = false;

    if (providerChoice === '2') {
      host = 'smtp.office365.com';
      port = 587;
      secure = false;
      console.log('-> Dipilih: Microsoft Outlook / Office 365\n');
    } else if (providerChoice === '3') {
      console.log('-> Dipilih: Custom SMTP Server\n');
      host = (await rl.question('Masukkan SMTP Host (cth: mail.company.com): ')).trim();
      const portInput = (await rl.question('Masukkan SMTP Port (cth: 587 atau 465) [default 587]: ')).trim() || '587';
      port = parseInt(portInput, 10);
      secure = port === 465;
    } else {
      console.log('-> Dipilih: Gmail / Google Workspace\n');
      console.log('💡 TIP GMAIL:');
      console.log('   Gunakan 16-digit "Google App Password" (bukan password akun biasa).');
      console.log('   Bisa dibuat di: myaccount.google.com -> Security -> 2-Step Verification -> App Passwords.\n');
    }

    // 2. Sender email
    let user = '';
    while (!user) {
      user = (await rl.question('Email Pengirim / Username SMTP (cth: qa.bot@company.com): ')).trim();
      if (!user) console.log('⚠️ Email pengirim tidak boleh kosong.');
    }

    // 3. Sender password / app password
    let pass = '';
    while (!pass) {
      pass = (await rl.question('Password / App Password: ')).trim();
      if (!pass) console.log('⚠️ Password tidak boleh kosong.');
    }

    // 4. Recipient emails
    let to = '';
    while (!to) {
      to = (await rl.question('Kirim report ke email mana saja? (pisahkan koma jika banyak): ')).trim();
      if (!to) console.log('⚠️ Minimal isi satu email penerima.');
    }

    // 5. Trigger Policy (Anti-Spam)
    console.log('\nKapan email test report mau dikirim? (Anti-Spam Policy):');
    console.log('  1) Manual saja   -> Hanya dikirim kalau kamu ketik "npm run report:email" [Recommended]');
    console.log('  2) On Failure    -> Otomatis dikirim HANYA JIKA ada test yang GAGAL/BROKEN');
    console.log('  3) CI/CD Only    -> Otomatis dikirim HANYA saat jalan di server CI/CD (GitHub Actions/Jenkins)');
    console.log('  4) Always        -> Selalu dikirim otomatis setiap kali test selesai dijalankan\n');

    const policyChoice = (await rl.question('Pilihan [1/2/3/4] (default: 1): ')).trim() || '1';
    let policy: 'manual' | 'on_failure' | 'ci_only' | 'always' = 'manual';
    if (policyChoice === '2') policy = 'on_failure';
    else if (policyChoice === '3') policy = 'ci_only';
    else if (policyChoice === '4') policy = 'always';

    // 6. Optional dashboard URL
    console.log('\n(Opsional) URL Web Dashboard Allure perusahaan kamu:');
    const dashboardUrl = (await rl.question('URL Dashboard (tekan Enter untuk default localhost): ')).trim();

    // 7. Save to .env
    const envPath = path.join(process.cwd(), '.env');
    const updates: Record<string, string> = {
      EMAIL_REPORT_ENABLED: policy !== 'manual' ? 'true' : 'false',
      EMAIL_TRIGGER_POLICY: policy,
      SMTP_HOST: host,
      SMTP_PORT: port.toString(),
      SMTP_SECURE: secure ? 'true' : 'false',
      SMTP_USER: user,
      SMTP_PASS: pass,
      SMTP_FROM: `"Qualisera QA Automation" <${user}>`,
      EMAIL_TO: to
    };

    if (dashboardUrl) {
      updates.REPORT_DASHBOARD_URL = dashboardUrl;
    }

    saveEnvFile(envPath, updates);

    console.log('\n=============================================================');
    console.log('✅ Konfigurasi Email Reporter Berhasil Disimpan ke .env!');
    console.log('=============================================================');
    console.log(`  • Provider Host   : ${host}:${port}`);
    console.log(`  • Sender Account  : ${user}`);
    console.log(`  • Recipients      : ${to}`);
    console.log(`  • Trigger Policy  : ${policy.toUpperCase()} (Anti-Spam Protected)`);
    console.log('-------------------------------------------------------------');
    console.log('Perintah yang bisa kamu pakai sekarang:');
    console.log('  👉 Kirim email report sekarang:   npm run report:email');
    console.log('  👉 Lihat preview HTML lokal:      npm run report:email:preview\n');

  } finally {
    rl.close();
  }
}

runWizard().catch((err) => {
  console.error('\n❌ Terjadi kesalahan pada wizard:', err);
  process.exit(1);
});
