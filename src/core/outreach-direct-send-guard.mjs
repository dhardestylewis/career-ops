#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPTS = join(ROOT, 'src/scripts');
const DIRECT_SEND_RE = /gmail\.users\.(?:messages|drafts)\.send\s*\(|api\.hsforms\.com\/submissions|\bresend\.emails\.send\s*\(|\.sendMail\s*\(|\bchat\.postMessage\s*\(/;
const SAFE_GUARDS = ['guardedGmailMessageSend(', 'guardedGmailDraftSend(', 'blockLegacyDirectOutreachSend('];

function filesUnder(dir) {
  const result = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) result.push(...filesUnder(full));
    else if (/\.(?:mjs|cjs|js|ts|tsx)$/i.test(name)) result.push(full);
  }
  return result;
}

const violations = [];
for (const file of filesUnder(SCRIPTS)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const source = readFileSync(file, 'utf8');
  const submitsGtmForm = /\/submit_gtm[^/]*\.mjs$/i.test(rel) && /\bfetch\s*\(/.test(source) && /method:\s*['"]POST['"]/i.test(source);
  if (!DIRECT_SEND_RE.test(source) && !submitsGtmForm) continue;
  if (!SAFE_GUARDS.some(marker => source.includes(marker))) violations.push(rel);
}

if (violations.length) {
  console.error('Direct outreach send APIs without a relationship guard:');
  for (const file of violations) console.error(`  ${file}`);
  process.exit(1);
}

console.log('outreach direct-send guard passed');
