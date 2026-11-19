import fs from 'fs';
import path from 'path';

interface TestCase {
  id: string;
  module: string;
  reqKey: string;
  acId?: string;
  featureTitle: string;
  scenarioTitle: string;
  type: string;
  priority: string;
  status: string;
  tags: string[];
  steps: string[];
  expectedResult: string;
}

const MODULES_MAP: Record<string, string> = {
  sample: 'Sample Feature Verification'
};

function parseFeatureFiles(): TestCase[] {
  const featuresBaseDir = path.join(__dirname, '../features');
  const testCases: TestCase[] = [];
  let tcCounter = 1;

  const modules = fs.readdirSync(featuresBaseDir).filter((file) => {
    return fs.statSync(path.join(featuresBaseDir, file)).isDirectory();
  });

  for (const mod of modules) {
    const modDir = path.join(featuresBaseDir, mod, 'features');
    if (!fs.existsSync(modDir)) continue;

    const featureFiles = fs.readdirSync(modDir).filter((f) => f.endsWith('.feature'));

    for (const ff of featureFiles) {
      const fullPath = path.join(modDir, ff);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      let currentReqKey = 'KTK-GEN';
      let featureTitle = mod;
      let currentTags: string[] = [];
      let inScenario = false;
      let currentScenarioTitle = '';
      let currentSteps: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        if (line.includes('@REQ-') || line.includes('@JIRA-')) {
          const match = line.match(/@(REQ|JIRA)-([A-Z0-9-]+)/);
          if (match) currentReqKey = match[2];
        }

        if (line.startsWith('Feature:')) {
          featureTitle = line.replace('Feature:', '').trim();
          continue;
        }

        if (line.startsWith('@') && !inScenario) {
          const tags = line.split(/\s+/).filter((t) => t.startsWith('@'));
          currentTags.push(...tags);
          continue;
        }

        if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
          if (inScenario && currentScenarioTitle) {
            testCases.push(buildTestCase(tcCounter++, mod, currentReqKey, featureTitle, currentScenarioTitle, currentTags, currentSteps));
            currentSteps = [];
            currentTags = [];
          }
          inScenario = true;
          currentScenarioTitle = line.replace(/Scenario( Outline)?:/, '').trim();
          continue;
        }

        if (inScenario) {
          if (line.startsWith('@')) {
            // New scenario tags
            testCases.push(buildTestCase(tcCounter++, mod, currentReqKey, featureTitle, currentScenarioTitle, currentTags, currentSteps));
            inScenario = false;
            currentScenarioTitle = '';
            currentSteps = [];
            currentTags = line.split(/\s+/).filter((t) => t.startsWith('@'));
          } else if (
            line.startsWith('Given ') ||
            line.startsWith('When ') ||
            line.startsWith('Then ') ||
            line.startsWith('And ') ||
            line.startsWith('But ')
          ) {
            currentSteps.push(line);
          }
        }
      }

      if (inScenario && currentScenarioTitle) {
        testCases.push(buildTestCase(tcCounter++, mod, currentReqKey, featureTitle, currentScenarioTitle, currentTags, currentSteps));
      }
    }
  }

  return testCases;
}

function buildTestCase(
  num: number,
  moduleKey: string,
  reqKey: string,
  featureTitle: string,
  scenarioTitle: string,
  tags: string[],
  steps: string[]
): TestCase {
  const acTag = tags.find((t) => t.startsWith('@AC-'));
  const acId = acTag ? acTag.replace('@', '') : undefined;
  const p0 = tags.includes('@p0');
  const p1 = tags.includes('@p1');
  const p2 = tags.includes('@p2');
  const id = `TC-KTK-${String(num).padStart(3, '0')}`;
  const isSmoke = tags.includes('@smoke');
  const isRegression = tags.includes('@regression');
  const isNegative = tags.includes('@negative') || scenarioTitle.toLowerCase().includes('negative') || scenarioTitle.toLowerCase().includes('fail') || scenarioTitle.toLowerCase().includes('error');
  const isBva = tags.includes('@bva') || scenarioTitle.toLowerCase().includes('boundary') || scenarioTitle.toLowerCase().includes('bva');
  const isSecurity = tags.includes('@security') || scenarioTitle.toLowerCase().includes('injection') || scenarioTitle.toLowerCase().includes('script');
  const isPermission = tags.includes('@permission');
  const isLifecycle = tags.includes('@lifecycle');

  let type = 'Positive Functional';
  if (isSecurity) type = 'Security & Sanitization';
  else if (isBva) type = 'Boundary Value Analysis';
  else if (isNegative) type = 'Negative Validation';
  else if (isPermission) type = 'Permission & Hardware';
  else if (isLifecycle) type = 'App Lifecycle';
  else if (isSmoke) type = 'Smoke / Critical Path';

  let priority = 'P1 (Regression)';
  if (p0 || isSmoke) priority = 'P0 (Smoke / Critical)';
  else if (p2) priority = 'P2 (Edge Case)';
  else if (p1 || isRegression) priority = 'P1 (Regression)';
  else if (isBva || isSecurity) priority = 'P2 (Edge Case)';

  const status = tags.includes('@manual') ? 'Manual' : 'Automated';

  const thenSteps = steps.filter((s) => s.startsWith('Then ') || s.startsWith('And '));
  const expectedResult = thenSteps.length > 0 ? thenSteps[thenSteps.length - 1].replace(/^(Then|And)\s+/, '') : 'System performs action according to spec';

  return {
    id,
    module: MODULES_MAP[moduleKey] || moduleKey,
    reqKey,
    acId,
    featureTitle,
    scenarioTitle,
    type,
    priority,
    status,
    tags,
    steps,
    expectedResult
  };
}

function generateMarkdown(testCases: TestCase[]): string {
  const total = testCases.length;
  const automated = testCases.filter((t) => t.status === 'Automated').length;
  const manual = total - automated;

  const modulesGroup: Record<string, TestCase[]> = {};
  for (const tc of testCases) {
    if (!modulesGroup[tc.module]) modulesGroup[tc.module] = [];
    modulesGroup[tc.module].push(tc);
  }

  let md = `# Qualisera Mobile Automation - Comprehensive Test Case Specification & RTM\n\n`;
  md += `> [!NOTE]\n`;
  md += `> **Single Source of Truth Notice:** This document is automatically generated from Gherkin Feature files (\`features/**/*.feature\`) using the script \`npm run docs:generate\`. Do not edit this file manually.\n\n`;

  md += `## 1. Executive Summary & Test Statistics\n\n`;
  md += `| Test Metric | Value | Percentage |\n`;
  md += `| :--- | :---: | :---: |\n`;
  md += `| **Total Test Cases** | **${total}** | 100% |\n`;
  md += `| **Automated Test Cases** | **${automated}** | ${((automated / total) * 100).toFixed(1)}% |\n`;
  md += `| **Manual Verification Cases** | **${manual}** | ${((manual / total) * 100).toFixed(1)}% |\n\n`;

  md += `### Test Module Distribution\n\n`;
  md += `| Application Module | Total Scenarios | Automation Status | Requirement Key |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  for (const [modName, list] of Object.entries(modulesGroup)) {
    const req = list[0]?.reqKey || 'KTK-XXX';
    md += `| **${modName}** | ${list.length} | 🟢 100% Automated | \`@REQ-${req}\` |\n`;
  }
  md += `\n---\n\n`;

  md += `## 2. Requirements Traceability Matrix (RTM)\n\n`;
  md += `| Requirement / Jira | AC Mapping | Module | Test Case ID | Scenario Title | Test Category | Priority |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :---: |\n`;
  for (const tc of testCases) {
    const reqDisplay = tc.reqKey.startsWith('KTK-') ? `@REQ-${tc.reqKey}` : `@JIRA-${tc.reqKey}`;
    const acDisplay = tc.acId ? `\`@${tc.acId}\`` : '-';
    md += `| \`${reqDisplay}\` | ${acDisplay} | ${tc.module} | \`${tc.id}\` | ${tc.scenarioTitle} | ${tc.type} | ${tc.priority.split(' ')[0]} |\n`;
  }
  md += `\n---\n\n`;

  md += `## 3. Test Case Specification Details by Module\n\n`;
  for (const [modName, list] of Object.entries(modulesGroup)) {
    md += `### Module: ${modName}\n\n`;
    for (const tc of list) {
      md += `#### [${tc.id}] ${tc.scenarioTitle}\n`;
      md += `- **Requirement:** \`@REQ-${tc.reqKey}\`\n`;
      md += `- **Category:** ${tc.type}\n`;
      md += `- **Priority:** ${tc.priority}\n`;
      md += `- **Tags:** \`${tc.tags.join(' ')}\`\n`;
      md += `- **Test Steps (Gherkin):**\n`;
      for (const step of tc.steps) {
        md += `  \`${step}\`  \n`;
      }
      md += `- **Expected Result:** ${tc.expectedResult}\n\n`;
    }
  }

  return md;
}

function generateCSV(testCases: TestCase[]): string {
  const headers = [
    'Test Case ID',
    'Module',
    'Requirement Key',
    'Scenario Title',
    'Test Type',
    'Priority',
    'Automation Status',
    'Tags',
    'Test Steps',
    'Expected Result'
  ];

  const rows = [headers.join(',')];

  for (const tc of testCases) {
    const sanitizedSteps = `"${tc.steps.join(' -> ').replace(/"/g, '""')}"`;
    const sanitizedTitle = `"${tc.scenarioTitle.replace(/"/g, '""')}"`;
    const sanitizedExp = `"${tc.expectedResult.replace(/"/g, '""')}"`;
    const sanitizedTags = `"${tc.tags.join(' ')}"`;

    rows.push(
      [
        tc.id,
        `"${tc.module}"`,
        `@REQ-${tc.reqKey}`,
        sanitizedTitle,
        `"${tc.type}"`,
        `"${tc.priority}"`,
        tc.status,
        sanitizedTags,
        sanitizedSteps,
        sanitizedExp
      ].join(',')
    );
  }

  return '\uFEFF' + rows.join('\n');
}

function generateExcelXML(testCases: TestCase[]): string {
  const total = testCases.length;
  const automated = testCases.filter((t) => t.status === 'Automated').length;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0D6EFD" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Test Cases">
  <Table>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="90"/>
   <Column ss:Width="250"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="200"/>
   <Column ss:Width="350"/>
   <Column ss:Width="250"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Test Case ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Module</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Requirement Key</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Scenario Title</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Test Type</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Priority</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tags</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Steps (Gherkin)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Expected Result</Data></Cell>
   </Row>\n`;

  for (const tc of testCases) {
    xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.id)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.module)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml('@REQ-' + tc.reqKey)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.scenarioTitle)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.type)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.priority)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.status)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.tags.join(' '))}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.steps.join(' | '))}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tc.expectedResult)}</Data></Cell>
   </Row>\n`;
  }

  xml += `  </Table>
 </Worksheet>
</Workbook>`;
  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function main() {
  console.log('🔄 Parsing Gherkin feature files as Single Source of Truth...');
  const testCases = parseFeatureFiles();
  console.log(`✅ Successfully extracted ${testCases.length} BDD scenarios.`);

  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  console.log('📝 Generating docs/test-case-specification.md...');
  fs.writeFileSync(path.join(docsDir, 'test-case-specification.md'), generateMarkdown(testCases));

  console.log('📊 Generating docs/test-cases.csv...');
  fs.writeFileSync(path.join(docsDir, 'test-cases.csv'), generateCSV(testCases));

  console.log('📗 Generating docs/test-cases.xlsx...');
  fs.writeFileSync(path.join(docsDir, 'test-cases.xlsx'), generateExcelXML(testCases));

  console.log('🎉 Done! All test case specifications synchronized with zero drift.');
}

main();
