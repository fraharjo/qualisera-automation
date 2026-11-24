import fs from 'fs';
import path from 'path';

interface ContractOccurrence {
  file: string;
  screenName: string;
  line: number;
  getter: string;
  contractId: string;
}

const isStrict = process.argv.includes('--strict');
const targetArg = process.argv.find((arg) => !arg.startsWith('--') && arg !== process.argv[0] && arg !== process.argv[1]);

function findScreenFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findScreenFiles(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.screen.ts') || entry.name.endsWith('.page.ts'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

let screenFiles: string[] = [];

if (targetArg) {
  const resolved = path.resolve(targetArg);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ Target path not found: ${targetArg}`);
    process.exit(1);
  }
  if (fs.statSync(resolved).isFile()) {
    screenFiles.push(resolved);
  } else {
    screenFiles = findScreenFiles(resolved);
  }
} else {
  const featuresDir = path.join(__dirname, '../features');
  const sharedPagesDir = path.join(__dirname, '../shared/pages');
  const generatedDir = path.join(__dirname, '../generated');

  screenFiles.push(...findScreenFiles(featuresDir));
  screenFiles.push(...findScreenFiles(sharedPagesDir));
  if (fs.existsSync(generatedDir)) {
    screenFiles.push(...findScreenFiles(generatedDir));
  }
}

const contracts: ContractOccurrence[] = [];

for (const filePath of screenFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(path.join(__dirname, '..'), filePath);
  const screenName = path.basename(filePath, path.extname(filePath));

  lines.forEach((lineText, idx) => {
    if (lineText.includes('.contract(')) {
      const lineNum = idx + 1;
      let getterName = 'unknown';

      // Look back a few lines if getter was on previous line
      for (let lookback = idx; lookback >= Math.max(0, idx - 3); lookback--) {
        const matchGetter = lines[lookback].match(/(?:get\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+)\s*[:=])/);
        if (matchGetter) {
          getterName = matchGetter[1] || matchGetter[2];
          break;
        }
      }

      let match: RegExpExecArray | null;
      const localRegex = /(?:this|screen)\.contract\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      while ((match = localRegex.exec(lineText)) !== null) {
        contracts.push({
          file: relPath,
          screenName,
          line: lineNum,
          getter: getterName,
          contractId: match[1],
        });
      }
    }
  });
}

console.log('\n============================================================');
console.log('              UI CONTRACT & TESTABILITY AUDIT');
console.log('============================================================\n');
console.log(`🔍 Scanned ${screenFiles.length} Screen Object file(s).`);

if (contracts.length === 0) {
  console.log('✅ All UI elements are linked with concrete locators (0 unresolved contracts)!\n');
  process.exit(0);
}

console.log(`⚠️  Found ${contracts.length} unresolved UI Contract(s) awaiting real locators or dev IDs:\n`);

console.log('| No | Screen / File | Getter / Element | Contract ID | Line | Status |');
console.log('|---|---|---|---|---|---|');
contracts.forEach((c, i) => {
  console.log(`| ${i + 1} | \`${c.screenName}\` | \`${c.getter}\` | \`${c.contractId}\` | L${c.line} | ⚠️ Awaiting ID / Scan |`);
});

console.log('\n------------------------------------------------------------');
console.log('📋 DEVELOPER TESTABILITY REQUESTS (Copy-paste to Jira / Slack):');
console.log('------------------------------------------------------------');
contracts.forEach((c) => {
  console.log(`• Screen: [${c.screenName}] -> Element: [${c.getter}]`);
  console.log(`  - Android: content-desc="${c.contractId}"`);
  console.log(`  - iOS:     accessibilityIdentifier="${c.contractId}"`);
  console.log(`  - Web:     data-testid="${c.contractId}"`);
  console.log(`  - File:    ${c.file}#L${c.line}`);
});

console.log('\n💡 TIPS REKONSILIASI PADA BUILD BARU:');
console.log('1. Scan Otomatis : Jalankan scanner/reconciler saat build baru siap di device/browser.');
console.log('2. Isi Manual    : Ganti pemanggilan `this.contract(...)` di file di atas dengan real locator.');
console.log('============================================================\n');

if (isStrict) {
  console.error('❌ Strict mode failed: Unresolved contracts found.');
  process.exit(1);
}
