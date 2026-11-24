/**
 * check-generated.ts - mechanical self-check for a generated test-design draft.
 *
 * Usage:   npm run check:generated -- generated/<feature>
 * Wire it: "check:generated": "ts-node scripts/check-generated.ts"
 *
 * Input: a folder holding <feature>.feature and test-matrix.md (or a path to a .feature file).
 * Exit code 1 when any ERROR is found. WARN lines are advisory.
 * Zero dependencies. Keep rules in sync with SKILL.md (Tag taxonomy, Phase 3 rules).
 */
import fs from 'node:fs';
import path from 'node:path';

type Step = { kw: string; text: string; line: number };
type Scenario = {
  title: string;
  outline: boolean;
  line: number;
  tags: string[]; // effective tags (Feature + Scenario)
  comments: string[]; // comment lines directly above the scenario's tag block
  steps: Step[];
  examplesHeader: string[];
  exampleRows: number;
};
type Parsed = { featureTags: string[]; background: Step[]; scenarios: Scenario[] };

// ---- taxonomy (mirror of SKILL.md) -----------------------------------------
const PRIORITY = ['@p0', '@p1', '@p2'];
const EXECUTION = ['@automated', '@manual'];
const PLATFORM = ['@android', '@ios', '@web'];
const TYPE = ['@positive', '@negative', '@bva', '@functional', '@security', '@permission', '@lifecycle', '@network', '@concurrency', '@localization', '@accessibility'];
const RUNNER = ['@smoke', '@regression', '@e2e'];
const STATUS = ['@assumption', '@blocked', '@derived'];
const OTHER_ALLOWED = ['@api'];
const PATTERNS: RegExp[] = [/^@REQ-[\w-]+$/, /^@AC-\d{2}$/, /^@JIRA-[\w-]+$/, /^@feature-[\w-]+$/];
const KNOWN = new Set([...PRIORITY, ...EXECUTION, ...PLATFORM, ...TYPE, ...RUNNER, ...STATUS, ...OTHER_ALLOWED]);
const DERIVED_CAP = 5;

// ---- phrase rules ------------------------------------------------------------
const PLACEHOLDER: RegExp[] = [
  /according to (the |a |an )?(confirmed|agreed|defined|documented|expected|specified|applicable)/i,
  /\bper (the )?(policy|policies|rules?|spec|specification)\b/i,
  /\b(handled?|handles)\s+(safely|appropriately|properly|correctly|gracefully)\b/i,
  /\bas (defined|specified|expected|agreed)\b/i,
  /\bwithout (data corruption|unexpected)/i,
];
const UI_OPEN = /\bopens?\s+(the\s+)?(web\s+)?(app|application|browser|page|url|site)\b/i;
const ACTION_PLACEHOLDER = /<(action|operation|verb|method)>/i;
const CREDENTIAL = /\b(password|passwd|pin|token|secret|api[ _-]?key)\b\s*(?:is|=|:)?\s*"[^"]{3,}"/i;

// ---- parser -------------------------------------------------------------------
function tagsOf(line: string): string[] {
  return line.split(/\s+/).filter((t) => t.startsWith('@'));
}

function parse(text: string): Parsed {
  const lines = text.split(/\r?\n/);
  const out: Parsed = { featureTags: [], background: [], scenarios: [] };
  let pendingTags: string[] = [];
  let pendingComments: string[] = [];
  let cur: Scenario | null = null;
  let inBg = false;
  let inExamples = false;
  let headerSeen = false;

  lines.forEach((raw, i) => {
    const l = raw.trim();
    const no = i + 1;
    if (!l) return;
    if (l.startsWith('#')) {
      pendingComments.push(l);
      return;
    }
    if (l.startsWith('@')) {
      pendingTags.push(...tagsOf(l));
      return;
    }
    if (/^Feature:/i.test(l)) {
      out.featureTags = pendingTags;
      pendingTags = [];
      pendingComments = [];
      return;
    }
    if (/^Background:/i.test(l)) {
      inBg = true;
      inExamples = false;
      cur = null;
      pendingTags = [];
      pendingComments = [];
      return;
    }
    if (/^Examples:|^Scenarios:/i.test(l)) {
      inExamples = true;
      headerSeen = false;
      pendingTags = [];
      pendingComments = [];
      return;
    }
    const sc = l.match(/^Scenario( Outline| Template)?:\s*(.*)/i);
    if (sc) {
      inBg = false;
      inExamples = false;
      cur = {
        title: (sc[2] ?? '').trim(),
        outline: !!sc[1],
        line: no,
        tags: [...out.featureTags, ...pendingTags],
        comments: pendingComments,
        steps: [],
        examplesHeader: [],
        exampleRows: 0,
      };
      out.scenarios.push(cur);
      pendingTags = [];
      pendingComments = [];
      return;
    }
    if (l.startsWith('|')) {
      if (cur && inExamples) {
        const cells = l.split('|').slice(1, -1).map((c) => c.trim());
        if (!headerSeen) {
          cur.examplesHeader = cells;
          headerSeen = true;
        } else cur.exampleRows += 1;
      }
      return;
    }
    const st = l.match(/^(Given|When|Then|And|But|\*)\s+(.*)/);
    if (st) {
      const step: Step = { kw: st[1] ?? '', text: (st[2] ?? '').trim(), line: no };
      if (inBg) out.background.push(step);
      else if (cur) cur.steps.push(step);
    }
    pendingComments = [];
  });
  return out;
}

// ---- checks ---------------------------------------------------------------------
const errors: string[] = [];
const warns: string[] = [];
const err = (line: number, msg: string): void => void errors.push(`ERROR line ${line}: ${msg}`);
const warn = (line: number, msg: string): void => void warns.push(`WARN  line ${line}: ${msg}`);
const count = (tags: string[], set: string[]): number => tags.filter((t) => set.includes(t)).length;

function checkScenario(s: Scenario): void {
  const at = s.line;
  const t = s.tags;
  const label = `"${s.title}"`;

  for (const tag of new Set(t)) {
    if (!KNOWN.has(tag) && !PATTERNS.some((p) => p.test(tag))) err(at, `${label}: tag ${tag} is not in the taxonomy (new tag ideas go to open questions)`);
  }
  if (count(t, PRIORITY) !== 1) err(at, `${label}: needs exactly one of @p0/@p1/@p2`);
  if (count(t, EXECUTION) !== 1) err(at, `${label}: needs exactly one of @automated/@manual`);
  if (count(t, PLATFORM) < 1) err(at, `${label}: missing platform tag (@android/@ios/@web)`);
  if (!t.some((x) => x.startsWith('@feature-'))) err(at, `${label}: missing @feature-<module>`);
  if (!t.some((x) => x.startsWith('@REQ-') || x.startsWith('@JIRA-'))) err(at, `${label}: missing traceability tag (@REQ-* or @JIRA-*)`);
  if (count(t, TYPE) < 1) err(at, `${label}: needs at least one Type tag`);

  const derived = t.includes('@derived');
  const hasAc = t.some((x) => /^@AC-\d{2}$/.test(x));
  if (derived && hasAc) err(at, `${label}: @derived scenarios must not carry @AC-nn`);
  if (!derived && !hasAc) err(at, `${label}: missing @AC-nn (or tag @derived if no confirmed AC backs it)`);

  const manual = t.includes('@manual');
  const auto = t.includes('@automated');
  if (manual && count(t, ['@automated', ...RUNNER]) > 0) err(at, `${label}: @manual must not carry @automated/@smoke/@regression/@e2e`);
  if (auto && t.includes('@p0') && !t.includes('@smoke') && !t.includes('@e2e')) err(at, `${label}: @automated @p0 needs @smoke (or @e2e)`);
  if (auto && (t.includes('@p1') || t.includes('@p2')) && !t.includes('@regression') && !t.includes('@e2e')) err(at, `${label}: @automated @p1/@p2 needs @regression (or @e2e)`);

  const note = s.comments.join(' ');
  if (t.includes('@assumption') && !/assumption:/i.test(note)) err(at, `${label}: @assumption needs a "# Assumption: ..." comment above the scenario`);
  if (t.includes('@blocked') && !/open question:/i.test(note)) err(at, `${label}: @blocked needs a "# Open question: ..." comment above the scenario`);

  let afterThen = false;
  for (const st of s.steps) {
    if (st.kw === 'Then') afterThen = true;
    else if (st.kw === 'When' || st.kw === 'Given') afterThen = false;
    if (afterThen) {
      if (PLACEHOLDER.some((p) => p.test(st.text))) err(st.line, `${label}: placeholder / policy-referencing assertion: "${st.text}"`);
      else if (/\sor\s/i.test(st.text)) warn(st.line, `${label}: possible ambiguous OR outcome: "${st.text}"`);
    }
    if (ACTION_PLACEHOLDER.test(st.text)) err(st.line, `${label}: Outline varies the action itself (${st.text.match(ACTION_PLACEHOLDER)?.[0]}); split by business flow`);
    if (CREDENTIAL.test(st.text)) warn(st.line, `${label}: credential-like literal in step, move to .env/data factory`);
    if (t.includes('@api') && UI_OPEN.test(st.text)) err(st.line, `${label}: @api scenario contains a UI navigation step`);
  }
  if (s.examplesHeader.some((h) => /^(action|operation|verb|method)$/i.test(h))) err(at, `${label}: Examples column "${s.examplesHeader.join(', ')}" mixes different actions in one Outline`);
}

function normalize(x: string): string {
  return x.replace(/\\\|/g, '|').replace(/\s+/g, ' ').trim();
}

function main(): void {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: check-generated <generated/feature-dir | file.feature>');
    process.exit(2);
  }
  const isFile = fs.existsSync(arg) && fs.statSync(arg).isFile();
  const dir = isFile ? path.dirname(arg) : arg;
  const features = isFile ? [arg] : fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.feature')).map((f) => path.join(dir, f)) : [];
  if (!features.length) {
    console.error(`No .feature file found in ${arg}`);
    process.exit(2);
  }
  const matrixPath = path.join(dir, 'test-matrix.md');
  const matrix = fs.existsSync(matrixPath) ? normalize(fs.readFileSync(matrixPath, 'utf8')) : null;
  if (matrix === null) errors.push(`ERROR: ${matrixPath} not found (Phase 6 requires a matrix)`);

  const titles = new Set<string>();
  let total = 0;
  let rows = 0;
  let derivedCount = 0;
  const byDisposition: Record<string, number> = {};

  for (const f of features) {
    const p = parse(fs.readFileSync(f, 'utf8'));
    total += p.scenarios.length;
    const anyApi = p.scenarios.some((s) => s.tags.includes('@api'));
    if (anyApi) for (const b of p.background) if (UI_OPEN.test(b.text)) err(b.line, `Background has a UI navigation step ("${b.text}") but the feature has @api scenarios`);
    for (const s of p.scenarios) {
      checkScenario(s);
      rows += s.outline ? s.exampleRows : 1;
      if (s.tags.includes('@derived')) derivedCount += 1;
      const disp = s.tags.includes('@blocked') ? 'blocked' : s.tags.includes('@manual') ? 'manual' : 'automated';
      byDisposition[disp] = (byDisposition[disp] ?? 0) + 1;
      if (titles.has(s.title)) err(s.line, `duplicate scenario title "${s.title}"`);
      titles.add(s.title);
      if (matrix !== null && !matrix.includes(normalize(s.title))) err(s.line, `"${s.title}" not found in test-matrix.md (use the exact title in the description column)`);
    }
  }
  if (derivedCount > DERIVED_CAP) errors.push(`ERROR: ${derivedCount} @derived scenarios, cap is ${DERIVED_CAP} per feature`);

  [...errors, ...warns].forEach((m) => console.log(m));
  console.log(`\nScenarios: ${total} (Outline counted once; ${rows} when each Examples row counts) | derived: ${derivedCount} | ${Object.entries(byDisposition).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  console.log(errors.length ? `FAILED: ${errors.length} error(s), ${warns.length} warning(s)` : `PASSED with ${warns.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}

main();
