import http from 'http';
import fs from 'fs';
import path from 'path';

interface ManualTestCase {
  id: string;
  module: string;
  title: string;
  steps: string[];
  tags: string[];
  priority?: string;
  ac?: string;
  jira?: string;
  status: 'NOT_EXECUTED' | 'PASSED' | 'FAILED' | 'BLOCKED';
  bugLink?: string;
  evidence: string[];
  executedBy?: string;
  executedAt?: string;
}

const PORT = 3000;
const FEATURES_DIR = path.join(__dirname, '../../features');
const RESULTS_DIR = path.join(__dirname, '../../reports/manual-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'manual-execution-results.json');
const EVIDENCE_DIR = path.join(RESULTS_DIR, 'evidence');

// Ensure dirs
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

function parseManualFeatures(): ManualTestCase[] {
  const existingResults: Record<string, Partial<ManualTestCase>> = {};
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
      for (const item of data) {
        existingResults[item.id] = item;
      }
    } catch (e) {
      console.error('Error reading existing results:', e);
    }
  }

  const manualCases: ManualTestCase[] = [];
  let counter = 1;

  const modules = fs.readdirSync(FEATURES_DIR).filter((f) => fs.statSync(path.join(FEATURES_DIR, f)).isDirectory());

  for (const mod of modules) {
    const modDir = path.join(FEATURES_DIR, mod, 'features');
    if (!fs.existsSync(modDir)) continue;

    const files = fs.readdirSync(modDir).filter((f) => f.endsWith('.feature'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(modDir, file), 'utf-8');
      const lines = content.split('\n');

      let currentTags: string[] = [];
      let inScenario = false;
      let scenarioTitle = '';
      let scenarioSteps: string[] = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line.startsWith('@')) {
          if (inScenario && scenarioTitle) {
            if (currentTags.includes('@manual')) {
              manualCases.push(createCase(counter++, mod, scenarioTitle, currentTags, scenarioSteps, existingResults));
            }
            scenarioTitle = '';
            scenarioSteps = [];
            inScenario = false;
          }
          currentTags.push(...line.split(/\s+/).filter((t) => t.startsWith('@')));
        } else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
          if (inScenario && scenarioTitle) {
            if (currentTags.includes('@manual')) {
              manualCases.push(createCase(counter++, mod, scenarioTitle, currentTags, scenarioSteps, existingResults));
            }
            scenarioSteps = [];
          }
          inScenario = true;
          scenarioTitle = line.replace(/Scenario( Outline)?:/, '').trim();
        } else if (inScenario && (line.startsWith('Given ') || line.startsWith('When ') || line.startsWith('Then ') || line.startsWith('And ') || line.startsWith('But '))) {
          scenarioSteps.push(line);
        }
      }

      if (inScenario && scenarioTitle && currentTags.includes('@manual')) {
        manualCases.push(createCase(counter++, mod, scenarioTitle, currentTags, scenarioSteps, existingResults));
      }
    }
  }

  return manualCases;
}

function createCase(
  num: number,
  mod: string,
  title: string,
  tags: string[],
  steps: string[],
  existing: Record<string, Partial<ManualTestCase>>
): ManualTestCase {
  const id = `MANUAL-${mod.toUpperCase()}-${String(num).padStart(3, '0')}`;
  const prev = existing[id] || {};

  const pTag = tags.find((t) => t.startsWith('@p'));
  const acTag = tags.find((t) => t.startsWith('@AC-'));
  const jiraTag = tags.find((t) => t.startsWith('@JIRA-') || t.startsWith('@REQ-'));

  return {
    id,
    module: mod,
    title,
    steps,
    tags,
    priority: pTag,
    ac: acTag,
    jira: jiraTag,
    status: prev.status || 'NOT_EXECUTED',
    bugLink: prev.bugLink || '',
    evidence: prev.evidence || [],
    executedBy: prev.executedBy || '',
    executedAt: prev.executedAt || ''
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Serve static UI
  if (pathname === '/' || pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // API: Get manual cases
  if (pathname === '/api/manual-cases' && req.method === 'GET') {
    const cases = parseManualFeatures();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cases));
    return;
  }

  // API: Save execution results
  if (pathname === '/api/save-results' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: payload.length }));
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Upload screenshot evidence
  if (pathname === '/api/upload-evidence' && req.method === 'POST') {
    // Simple multipart boundary parser for evidence image
    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];

    if (!boundary) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No boundary' }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const filename = `evidence_${Date.now()}.png`;
      const filePath = path.join(EVIDENCE_DIR, filename);

      // Extract image content between boundaries
      const headerEndIndex = buffer.indexOf('\r\n\r\n');
      const tailIndex = buffer.lastIndexOf(`\r\n--${boundary}`);

      if (headerEndIndex !== -1 && tailIndex !== -1) {
        const fileData = buffer.subarray(headerEndIndex + 4, tailIndex);
        fs.writeFileSync(filePath, fileData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: `/evidence/${filename}` }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to parse image data' }));
      }
    });
    return;
  }

  // Serve evidence images
  if (pathname.startsWith('/evidence/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(EVIDENCE_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Qualisera Manual QA Execution Dashboard is RUNNING!`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📋 SSoT: Reading all @manual scenarios from features/**/*.feature`);
  console.log(`💾 Results saved to: reports/manual-results/manual-execution-results.json`);
  console.log(`======================================================\n`);
});
