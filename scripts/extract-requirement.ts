#!/usr/bin/env ts-node
/**
 * Qualisera Requirement Document Extractor
 *
 * Extracts clean plain text / Markdown from diverse requirement formats:
 * Supports: .pdf, .docx, .html, .htm, .md, .txt, .csv, .json
 *
 * Usage:
 *   ts-node scripts/extract-requirement.ts <file-or-dir> [--save]
 *   npm run req:extract requirements/inputs/checkout/PRD.pdf
 *   npm run req:extract requirements/inputs/checkout/ --save
 */

import fs from 'fs';
import path from 'path';

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<t[dh][^>]*>/gi, ' | ')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractRequirementText(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = path.extname(resolved).toLowerCase();

  if (ext === '.pdf') {
    // Dynamic require to prevent unnecessary loading when not used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(resolved);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text.trim();
  }

  if (ext === '.docx') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ path: resolved });
    return stripHtml(result.value);
  }

  if (ext === '.doc') {
    throw new Error('.doc (legacy binary Word) is not supported. Please save/export as .docx or .pdf.');
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  if (ext === '.html' || ext === '.htm') {
    return stripHtml(raw);
  }

  return raw.trim();
}

function collectFiles(target: string): string[] {
  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) return [];

  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    return [resolved];
  }

  const validExts = ['.pdf', '.docx', '.html', '.htm', '.md', '.txt', '.csv', '.json'];
  const results: string[] = [];
  const entries = fs.readdirSync(resolved, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(resolved, entry.name);
    if (entry.isFile() && validExts.includes(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    } else if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      results.push(...collectFiles(full));
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSave = args.includes('--save');
  const targetArgs = args.filter((arg) => !arg.startsWith('--'));

  if (targetArgs.length === 0) {
    console.log(`
Usage:
  npm run req:extract <file-or-dir> [--save]

Supported formats:
  .pdf, .docx, .html, .htm, .md, .txt, .csv, .json

Flags:
  --save    Saves extracted output to <filename>.extracted.md next to original file
`);
    process.exit(0);
  }

  const allFiles: string[] = [];
  for (const t of targetArgs) {
    allFiles.push(...collectFiles(t));
  }

  if (allFiles.length === 0) {
    console.error(`❌ No compatible requirement files found in: ${targetArgs.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📄 Found ${allFiles.length} requirement document(s) to process:\n`);

  for (const file of allFiles) {
    const baseName = path.basename(file);
    try {
      const text = await extractRequirementText(file);
      console.log(`============================================================`);
      console.log(`SOURCE: ${baseName} (${(text.length)} chars)`);
      console.log(`============================================================`);

      if (shouldSave) {
        const outPath = path.join(path.dirname(file), `${path.parse(file).name}.extracted.md`);
        fs.writeFileSync(outPath, text, 'utf-8');
        console.log(`💾 Saved extracted markdown to: ${outPath}\n`);
      } else {
        // Preview first 500 characters
        const preview = text.length > 500 ? text.substring(0, 500) + '\n... [truncated in terminal preview, use --save to write full .md]' : text;
        console.log(preview);
        console.log(`\n(Tip: add --save flag to output to .extracted.md file)\n`);
      }
    } catch (err: any) {
      console.error(`❌ Error extracting ${baseName}: ${err.message}\n`);
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
