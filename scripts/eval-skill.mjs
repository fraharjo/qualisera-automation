#!/usr/bin/env node
// eval-skill.mjs — A/A2/B scoring: baseline AI (A), baseline+Gherkin (A2) vs skill (B)
// Zero dependency. Node 18+.
//   npm run eval:init -- REQ-001 REQ-002       -> bikin struktur folder
//   npm run eval:score                         -> hitung skor -> eval/results.csv + eval/summary.csv
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// ======================= CONFIG (edit / pakai env) =======================
const CFG = {
  root: process.env.EVAL_DIR || 'eval',
  conditions: (process.env.EVAL_CONDITIONS || 'A,A2,A3,B').split(',').filter(Boolean),
  // folder tempat step definition yg sudah ada (buat ngukur reuse step)
  stepsDirs: (process.env.STEPS_DIRS || 'shared/steps,features').split(',').filter(Boolean),
  skillVersion: process.env.SKILL_VERSION || 'v1',
  model: process.env.MODEL || 'unknown',
  // command opsional, boleh pakai {file} dan {dir}. Kosong = dilewati.
  lintCmd: process.env.LINT_CMD !== undefined ? process.env.LINT_CMD : 'npx ts-node scripts/lint-tags.ts "{file}"',
  dryRunCmd: process.env.DRYRUN_CMD || '',
  // tag wajib di tiap scenario, regex dipisah koma.
  requiredTags: (
    process.env.REQUIRED_TAGS !== undefined
      ? process.env.REQUIRED_TAGS
      : '^@feature-,^@(automated|manual)$,^@(android|ios|web)$'
  )
    .split(',')
    .filter(Boolean)
    .map((s) => new RegExp(s, 'i')),
  // tag yg dianggap referensi requirement (selain tag yg memuat req_id)
  reqTagRegex: /^@(REQ|US|TC|TICKET|JIRA|AC)[-_]?\w+$/i,
  // ambang konsistensi (C1)
  c1Good: 0.6,
  c1Ok: 0.35,
};

// bobot sesuai rubrik
const W = { A1: 3, A2: 2, A3: 2, B1: 3, B2: 3, B3: 2, B4: 2, C1: 2, C2: 2 };
const COLS = Object.keys(W);
const MANUAL = ['B1', 'B2', 'B4', 'C2']; // diisi manual, dipertahankan saat re-run
const HEADER = ['req_id', 'req_type', 'kondisi', 'run', 'versi_skill', 'model', ...COLS, 'total', 'skor_pct', 'catatan', 'catatan_manual'];

// ============================== helpers ==============================
const ls = (d) => (fs.existsSync(d) ? fs.readdirSync(d) : []);
const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
const num = (a, b) => parseInt(a.replace(/\D/g, '') || 0, 10) - parseInt(b.replace(/\D/g, '') || 0, 10);
function walk(d, out = []) {
  for (const n of ls(d)) {
    if (n === 'node_modules' || n.startsWith('.git')) continue;
    const p = path.join(d, n);
    isDir(p) ? walk(p, out) : out.push(p);
  }
  return out;
}
const esc = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
function parseCsv(t) {
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { f += '"'; i++; }
      else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

// =============================== init ================================
if (process.argv[2] === 'init') {
  const ids = process.argv.slice(3);
  if (!ids.length) ids.push('REQ-001');
  for (const id of ids) {
    for (const k of CFG.conditions) {
      for (let r = 1; r <= 3; r++) fs.mkdirSync(path.join(CFG.root, k, id, `run${r}`), { recursive: true });
    }
    const f = path.join(CFG.root, 'requirements', `${id}.md`);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    if (!fs.existsSync(f)) fs.writeFileSync(f, `# ${id}\n\n(tempel requirement di sini)\n`);
  }
  const t = path.join(CFG.root, 'req-types.csv');
  if (!fs.existsSync(t)) fs.writeFileSync(t, 'req_id,req_type\n' + ids.map((i) => `${i},sederhana`).join('\n') + '\n');
  fs.writeFileSync(
    path.join(CFG.root, 'baseline-prompt.txt'),
    'Buatkan test case lengkap dari requirement berikut:\n\n[tempel requirement]\n'
  );
  fs.writeFileSync(
    path.join(CFG.root, 'baseline-gherkin-prompt.txt'),
    'Buatkan test case lengkap dalam format Cucumber Gherkin (.feature) dari requirement berikut:\n\n[tempel requirement]\n'
  );
  fs.writeFileSync(
    path.join(CFG.root, 'baseline-repo-prompt.txt'),
    'Baca README.md, shared/steps/, dan features/sample/steps/ di repo ini, lalu buatkan test case lengkap dalam format Cucumber Gherkin (.feature) sesuai konvensi tag dan step repo dari requirement berikut:\n\n[tempel requirement]\n'
  );
  console.log(`Struktur dibuat di ./${CFG.root}
  - ${CFG.root}/requirements/<REQ>.md          isi requirement
  - ${CFG.root}/A/<REQ>/run1..3/               taruh output AI polos (prompt: ${CFG.root}/baseline-prompt.txt)
  - ${CFG.root}/A2/<REQ>/run1..3/              taruh output AI polos + Gherkin (prompt: ${CFG.root}/baseline-gherkin-prompt.txt)
  - ${CFG.root}/A3/<REQ>/run1..3/              taruh output AI polos + konvensi repo (prompt: ${CFG.root}/baseline-repo-prompt.txt)
  - ${CFG.root}/B/<REQ>/run1..3/               taruh output skill (*.feature)
  - ${CFG.root}/req-types.csv                  ubah req_type: sederhana/kompleks/ambigu/konflik/reuse/negatif
Lalu jalankan: npm run eval:score`);
  process.exit(0);
}

// ============================= gherkin ===============================
function parseGherkin(text) {
  text = text.replace(/^\s*```\w*\s*$/gm, '');
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  let feature = null, featTags = [], pending = [], cur = null, inBg = false;
  const bgSteps = [];
  const scenarios = [];
  for (const l of lines) {
    if (l.startsWith('@')) { pending.push(...l.split(/\s+/).filter((t) => t.startsWith('@'))); continue; }
    if (/^Feature:/i.test(l)) { feature = l; featTags = pending; pending = []; continue; }
    if (/^Background:/i.test(l)) { inBg = true; cur = null; pending = []; continue; }
    if (/^Examples:|^Scenarios:/i.test(l)) { pending = []; continue; }
    const sc = l.match(/^Scenario( Outline| Template)?:\s*(.*)/i);
    if (sc) {
      inBg = false;
      cur = { title: sc[2].trim(), tags: [...featTags, ...pending], steps: [] };
      pending = [];
      scenarios.push(cur);
      continue;
    }
    const st = l.match(/^(Given|When|Then|And|But|\*)\s+(.*)/);
    if (st) {
      if (inBg) bgSteps.push({ kw: st[1], text: st[2].trim() });
      else if (cur) cur.steps.push({ kw: st[1], text: st[2].trim() });
    }
  }
  return { feature, bgSteps, scenarios };
}

// step definition yg sudah ada -> regex list
function loadStepDefs() {
  const pats = [];
  for (const d of CFG.stepsDirs) {
    for (const f of walk(d)) {
      if (!/\.(ts|js|mjs)$/.test(f) || f.startsWith(CFG.root + path.sep)) continue;
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\b(?:Given|When|Then)\(\s*(['"`/])(.+?)\1/g)) {
        try {
          if (m[1] === '/') { pats.push(new RegExp(m[2])); continue; }
          const rx = m[2]
            .replace(/[.*+?^$()|[\]\\]/g, '\\$&')
            .replace(/\{string\}/g, `(?:"[^"]*"|'[^']*')`)
            .replace(/\{(?:int|float)\}/g, '-?\\d+(?:\\.\\d+)?')
            .replace(/\{word\}/g, '\\w+')
            .replace(/\{\w*\}/g, '.+');
          pats.push(new RegExp('^' + rx + '$'));
        } catch { /* skip pola yg gagal di-parse */ }
      }
    }
  }
  return pats;
}

function runCmd(tpl, file, dir) {
  const cmd = tpl.replaceAll('{file}', file).replaceAll('{dir}', dir);
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', timeout: 180000 });
  return r.status === 0;
}

const NEG = /(invalid|salah|gagal|kosong|tidak|error|negative|negatif|fail|reject|ditolak|expired|kurang|melebihi|empty|wrong|unauthorized|denied|lock)/i;
const BND = /(batas|maksimum|maksimal|minimum|minimal|boundary|\bmax\b|\bmin\b|limit|tepat|karakter|cap|exact|\d{3,})/i;
const tokens = (s) => new Set((s.toLowerCase().match(/[a-z0-9]{3,}/g) || []));
const jac = (a, b) => {
  if (!a.size && !b.size) return 1;
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / (a.size + b.size - i);
};

// ============================ scoring 1 run ===========================
function scoreRun(cond, req, runDir, defs) {
  const files = walk(runDir).filter((f) => /\.(feature|md|txt)$/i.test(f));
  if (!files.length) return null;
  const text = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const g = parseGherkin(text);
  const notes = [];
  const sc = g.scenarios;
  const valid = !!g.feature && sc.length > 0 && sc.every((s) => s.steps.length >= 2);

  // A1: valid + (opsional) lint / dry-run
  let A1;
  if (!valid) { A1 = 0; notes.push('bukan gherkin valid (Feature/Scenario/steps)'); }
  else {
    const cmds = [CFG.lintCmd, CFG.dryRunCmd].filter(Boolean);
    const feats = files.filter((f) => f.endsWith('.feature'));
    if (!cmds.length || !feats.length) { A1 = 1; notes.push('A1 cuma cek sintaks (set LINT_CMD/DRYRUN_CMD & pakai .feature)'); }
    else {
      const ok = feats.every((f) => cmds.every((c) => runCmd(c, f, runDir)));
      A1 = ok ? 2 : 1;
      if (!ok) notes.push('lint/dry-run gagal');
    }
  }

  // A2: format & struktur
  let A2 = 0, A3 = 0, B3 = 0;
  if (valid) {
    const v = [];
    if (sc.some((s) => !s.tags.length)) v.push('ada scenario tanpa tag');
    for (const rx of CFG.requiredTags) if (sc.some((s) => !s.tags.some((t) => rx.test(t)))) v.push(`tag wajib ${rx} kurang`);
    if (sc.some((s) => !s.steps.some((x) => x.kw === 'Then'))) v.push('ada scenario tanpa Then');
    if (sc.some((s) => !s.title)) v.push('ada scenario tanpa judul');
    A2 = v.length === 0 ? 2 : v.length <= 2 ? 1 : 0;
    if (v.length) notes.push('A2: ' + v.join('; '));

    // A3: duplikat + reuse step existing (termasuk step di Background)
    const sigs = sc.map((s) => s.steps.map((x) => x.text.toLowerCase()).join('|'));
    const dup = sigs.length - new Set(sigs).size;
    const all = [
      ...g.bgSteps.map((x) => x.text),
      ...sc.flatMap((s) => s.steps.map((x) => x.text)),
    ];
    const reuse = defs.length ? all.filter((t) => defs.some((rx) => rx.test(t))).length / all.length : null;
    if (reuse === null) A3 = dup === 0 ? 2 : dup <= 2 ? 1 : 0;
    else {
      A3 = reuse >= 0.6 ? 2 : reuse >= 0.3 ? 1 : 0;
      if (dup > 0) A3 = Math.max(0, A3 - 1);
    }
    notes.push(`dup=${dup}` + (reuse === null ? ' reuse=n/a(step def tidak ketemu)' : ` reuse=${Math.round(reuse * 100)}%`));

    // B3: traceability
    const rid = req.toLowerCase();
    const traced = sc.filter((s) => s.tags.some((t) => t.toLowerCase().includes(rid) || CFG.reqTagRegex.test(t)) || s.title.toLowerCase().includes(rid)).length;
    const ratio = traced / sc.length;
    B3 = ratio === 1 ? 2 : ratio >= 0.5 ? 1 : 0;
    notes.push(`trace=${Math.round(ratio * 100)}%`);
  }

  // hint buat B1 (manual): sebaran jenis skenario
  const neg = sc.filter((s) => NEG.test(s.title + ' ' + s.tags.join(' '))).length;
  const bnd = sc.filter((s) => BND.test(s.title + ' ' + s.tags.join(' '))).length;
  notes.push(`scen=${sc.length} neg=${neg} bound=${bnd}`);

  const sets = sc.map((s) => tokens(s.title + ' ' + s.steps.map((x) => x.text).join(' ')));
  return { A1, A2, A3, B3, notes, sets };
}

function consistency(scored) {
  if (scored.length < 2) return { C1: '', note: 'C1 butuh >=2 run' };
  const dir = (a, b) => (a.length ? a.reduce((s, x) => s + Math.max(0, ...b.map((y) => jac(x, y))), 0) / a.length : 0);
  const sims = [];
  for (let i = 0; i < scored.length; i++)
    for (let j = i + 1; j < scored.length; j++) sims.push((dir(scored[i].sets, scored[j].sets) + dir(scored[j].sets, scored[i].sets)) / 2);
  const m = sims.reduce((a, b) => a + b, 0) / sims.length;
  return { C1: m >= CFG.c1Good ? 2 : m >= CFG.c1Ok ? 1 : 0, note: `sim=${m.toFixed(2)}` };
}

// ================================ main ================================
if (!isDir(CFG.root)) {
  console.error(`Folder ./${CFG.root} belum ada. Jalankan dulu: npm run eval:init -- REQ-001 REQ-002`);
  process.exit(1);
}
const typeMap = {};
const tf = path.join(CFG.root, 'req-types.csv');
if (fs.existsSync(tf)) parseCsv(fs.readFileSync(tf, 'utf8')).slice(1).forEach((r) => (typeMap[r[0]] = r[1]));

// pertahankan isian manual dari run sebelumnya
const out = path.join(CFG.root, 'results.csv');
const prev = {};
if (fs.existsSync(out)) {
  const rows = parseCsv(fs.readFileSync(out, 'utf8'));
  const h = rows[0] || [];
  for (const r of rows.slice(1)) {
    const o = Object.fromEntries(h.map((k, i) => [k, r[i] ?? '']));
    prev[`${o.req_id}|${o.kondisi}|${o.run}`] = o;
  }
}

const defs = loadStepDefs();
console.log(`Step definition existing terbaca: ${defs.length}${defs.length ? '' : ' (reuse tidak dinilai, cek STEPS_DIRS)'}`);

const rows = [];
for (const cond of CFG.conditions) {
  const cd = path.join(CFG.root, cond);
  if (!isDir(cd)) continue;
  for (const req of ls(cd).filter((n) => isDir(path.join(cd, n))).sort()) {
    const scored = [];
    for (const run of ls(path.join(cd, req)).filter((n) => /^run\d+$/.test(n)).sort(num)) {
      const s = scoreRun(cond, req, path.join(cd, req, run), defs);
      if (s) scored.push({ run, ...s });
    }
    const c = consistency(scored);
    for (const s of scored) {
      const runNum = s.run.replace('run', '');
      const p = prev[`${req}|${cond}|${runNum}`] || {};
      const r = {
        req_id: req, req_type: typeMap[req] || 'unknown', kondisi: cond, run: runNum,
        versi_skill: cond === 'B' ? CFG.skillVersion : '-', model: CFG.model,
        A1: s.A1, A2: s.A2, A3: s.A3, B3: s.B3, C1: c.C1,
        catatan: [...s.notes, c.note].join(' | '),
        catatan_manual: p.catatan_manual || '',
      };
      for (const k of MANUAL) r[k] = p[k] ?? '';
      let earned = 0, max = 0;
      for (const k of COLS) {
        const v = r[k];
        if (v === '' || v === undefined || Number.isNaN(Number(v))) continue;
        earned += Number(v) * W[k];
        max += 2 * W[k];
      }
      r.total = earned;
      r.skor_pct = max ? Math.round((earned / max) * 100) : '';
      rows.push(r);
    }
  }
}

if (!rows.length) {
  console.error('Belum ada output di eval/A/..., eval/A2/..., dan eval/B/... (file .feature/.md/.txt di dalam folder runN).');
  process.exit(1);
}
fs.writeFileSync(out, [HEADER.join(','), ...rows.map((r) => HEADER.map((k) => esc(r[k])).join(','))].join('\n') + '\n');

// ============================== summary ==============================
const groups = {};
for (const r of rows) for (const key of [`${r.kondisi}|ALL`, `${r.kondisi}|${r.req_type}`]) (groups[key] ||= []).push(r);
const avg = (rs, k) => {
  const v = rs.map((r) => r[k]).filter((x) => x !== '' && !Number.isNaN(Number(x))).map(Number);
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : '';
};
const summary = Object.entries(groups).sort().map(([key, rs]) => {
  const [kondisi, req_type] = key.split('|');
  return { kondisi, req_type, n: rs.length, skor_pct: avg(rs, 'skor_pct'), ...Object.fromEntries(COLS.map((k) => [k, avg(rs, k)])) };
});
const sh = Object.keys(summary[0]);
fs.writeFileSync(path.join(CFG.root, 'summary.csv'), [sh.join(','), ...summary.map((s) => sh.map((k) => esc(s[k])).join(','))].join('\n') + '\n');

console.log('\n== Ringkasan (rata-rata, skala per aspek 0-2) ==');
console.table(summary);
const a = summary.find((s) => s.kondisi === 'A' && s.req_type === 'ALL');
const a2 = summary.find((s) => s.kondisi === 'A2' && s.req_type === 'ALL');
const a3 = summary.find((s) => s.kondisi === 'A3' && s.req_type === 'ALL');
const b = summary.find((s) => s.kondisi === 'B' && s.req_type === 'ALL');
if (a && b && a.skor_pct !== '' && b.skor_pct !== '') {
  console.log(`Selisih skor B vs A  (polos):         ${(b.skor_pct - a.skor_pct) >= 0 ? '+' : ''}${(b.skor_pct - a.skor_pct).toFixed(1)} poin persen`);
}
if (a2 && b && a2.skor_pct !== '' && b.skor_pct !== '') {
  console.log(`Selisih skor B vs A2 (polos+Gherkin): ${(b.skor_pct - a2.skor_pct) >= 0 ? '+' : ''}${(b.skor_pct - a2.skor_pct).toFixed(1)} poin persen`);
}
if (a3 && b && a3.skor_pct !== '' && b.skor_pct !== '') {
  console.log(`Selisih skor B vs A3 (polos+repo):    ${(b.skor_pct - a3.skor_pct) >= 0 ? '+' : ''}${(b.skor_pct - a3.skor_pct).toFixed(1)} poin persen`);
}
const empty = MANUAL.filter((k) => rows.some((r) => r[k] === ''));
if (empty.length) console.log(`\nCatatan: kolom manual belum terisi (${empty.join(', ')}). Isi di ${out}, lalu run ulang (isian manual dipertahankan).`);
console.log(`\nHasil: ${out}\nRingkasan: ${path.join(CFG.root, 'summary.csv')}`);
