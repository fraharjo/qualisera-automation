import fs from 'fs';
import path from 'path';

interface Violation {
  file: string;
  scenario: string;
  missing: string[];
}

const featuresBaseDir = path.join(__dirname, '../features');
const modules = fs.readdirSync(featuresBaseDir).filter((file) => {
  return fs.statSync(path.join(featuresBaseDir, file)).isDirectory();
});

const violations: Violation[] = [];
let totalScenarios = 0;

for (const mod of modules) {
  const modDir = path.join(featuresBaseDir, mod, 'features');
  if (!fs.existsSync(modDir)) continue;

  const files = fs.readdirSync(modDir).filter((f) => f.endsWith('.feature'));

  for (const file of files) {
    const fullPath = path.join(modDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    let featureLevelTags: string[] = [];
    let scenarioLevelTags: string[] = [];
    let inFeatureHeader = true;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith('@') && inFeatureHeader) {
        featureLevelTags.push(...line.split(/\s+/).filter((t) => t.startsWith('@')));
      } else if (line.startsWith('Feature:')) {
        inFeatureHeader = false;
      } else if (line.startsWith('@') && !inFeatureHeader) {
        scenarioLevelTags.push(...line.split(/\s+/).filter((t) => t.startsWith('@')));
      } else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
        totalScenarios++;
        const scenarioTitle = line.replace(/Scenario( Outline)?:/, '').trim();
        const effectiveTags = Array.from(new Set([...featureLevelTags, ...scenarioLevelTags]));
        const missing: string[] = [];

        // Rule 1: Execution mode (@automated or @manual)
        const hasExecution = effectiveTags.includes('@automated') || effectiveTags.includes('@manual');
        if (!hasExecution) missing.push('Execution mode (@automated or @manual)');

        // Rule 2: Module tag (@feature-<name>)
        const hasModule = effectiveTags.some((t) => t.startsWith('@feature-'));
        if (!hasModule) missing.push('Module tag (@feature-<name>)');

        // Rule 3: Platform tag (@android, @ios, or @web)
        const hasPlatform = effectiveTags.includes('@android') || effectiveTags.includes('@ios') || effectiveTags.includes('@web');
        if (!hasPlatform) missing.push('Platform tag (@android, @ios, or @web)');

        // Rule 4: Runner filter tag for automated tests (@smoke or @regression)
        if (effectiveTags.includes('@automated')) {
          const hasRunner = effectiveTags.includes('@smoke') || effectiveTags.includes('@regression');
          if (!hasRunner) missing.push('Runner filter tag (@smoke or @regression)');
        }

        if (missing.length > 0) {
          violations.push({
            file: `${mod}/features/${file}`,
            scenario: scenarioTitle,
            missing
          });
        }

        scenarioLevelTags = [];
      }
    }
  }
}

console.log(`\n🔍 Checked ${totalScenarios} BDD scenarios across all feature modules.`);

if (violations.length > 0) {
  console.error(`\n⚠️  Found ${violations.length} scenario(s) missing mandatory runner tags (risking silent skip in CI):\n`);
  for (const v of violations) {
    console.error(`  📄 ${v.file}`);
    console.error(`     Scenario: "${v.scenario}"`);
    console.error(`     Missing: ${v.missing.join(', ')}\n`);
  }
  process.exit(1);
} else {
  console.log('✅ All scenarios adhere to the mandatory tag taxonomy perfectly!\n');
}
