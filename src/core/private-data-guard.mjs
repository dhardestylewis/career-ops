#!/usr/bin/env node

/**
 * private-data-guard.mjs
 *
 * Blocks user-layer and other private outreach/application artifacts from
 * being staged or tracked in Git.
 *
 * Default mode checks staged files so it can be used as a pre-commit hook.
 * Pass --tracked to inspect the committed file set instead.
 * Pass --self-test to validate the matcher logic without calling git.
 */

import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const argv = new Set(process.argv.slice(2));
const mode = argv.has('--tracked') ? 'tracked' : 'staged';

const PRIVATE_RULES = [
  { re: /^cv\.md$/, label: 'cv' },
  { re: /^config\/profile\.yml$/, label: 'profile' },
  { re: /^modes\/_profile\.md$/, label: 'profile mode' },
  { re: /^modes\/_custom\.md$/, label: 'custom mode' },
  { re: /^voice-dna\.md$/, label: 'voice rules' },
  { re: /^article-digest\.md$/, label: 'proof-point digest' },
  { re: /^portals\.yml$/, label: 'portals' },
  { re: /^data\/applications\.md$/, label: 'applications tracker' },
  { re: /^data\/applications\.db$/, label: 'applications index' },
  { re: /^data\/pipeline\.md$/, label: 'pipeline inbox' },
  { re: /^data\/scan-history\.tsv$/, label: 'scan history' },
  { re: /^data\/follow-ups\.md$/, label: 'follow-ups' },
  { re: /^data\/tracker\//, label: 'tracker data' },
  { re: /^data\/state\//, label: 'state data' },
  { re: /^data\/outreach-[^/]+$/, label: 'legacy outreach file' },
  { re: /^data\/outreach\//, label: 'outreach workspace' },
  { re: /^interview-prep\//, label: 'interview prep' },
  { re: /^reports\//, label: 'reports' },
  { re: /^output\//, label: 'output' },
  { re: /^jds\//, label: 'job descriptions' },
  { re: /^writing-samples\//, label: 'writing samples' },
  { re: /^credentials\.json$/, label: 'oauth credentials' },
  { re: /^token\.json$/, label: 'oauth token' },
  { re: /^data\/archive\/newlab-application-[^/]+\.(?:json|png)$/, label: 'newlab application archive' },
  { re: /^data\/archive\/submission_[^/]+\.(?:json|png)$/, label: 'submission archive' },
];

const SCAFFOLD_RE = /(^|\/)\.gitkeep$|(^|\/)README\.md$/;

function runGit(args) {
  try {
    return execFileSync('git', ['-C', ROOT, ...args], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = error?.stderr?.toString?.().trim?.() || error.message;
    throw new Error(`git ${args.join(' ')} failed: ${stderr}`);
  }
}

function listFiles() {
  const args = mode === 'tracked'
    ? ['ls-files']
    : ['diff', '--cached', '--name-only', '--diff-filter=ACMR'];
  const output = runGit(args);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function matchRule(file) {
  return PRIVATE_RULES.find((rule) => rule.re.test(file)) || null;
}

function isScaffold(file) {
  return SCAFFOLD_RE.test(file);
}

function checkFiles(files) {
  const violations = [];
  for (const file of files) {
    if (isScaffold(file)) continue;
    const rule = matchRule(file);
    if (rule) violations.push({ file, label: rule.label });
  }
  return violations;
}

function selfTest() {
  const cases = [
    { file: 'data/outreach/log.md', want: true },
    { file: 'data/outreach/next-batch.md', want: true },
    { file: 'data/archive/newlab-application-filled-20260706.json', want: true },
    { file: 'data/archive/submission_1783378551315_instawork-ml-engineer-instawork-robotics.json', want: true },
    { file: 'credentials.json', want: true },
    { file: 'token.json', want: true },
    { file: 'examples/outreach/README.md', want: false },
    { file: 'docs/outreach-guardrails.md', want: false },
  ];

  for (const { file, want } of cases) {
    const got = Boolean(matchRule(file)) && !isScaffold(file);
    if (got !== want) {
      throw new Error(`self-test mismatch for ${file}: expected ${want}, got ${got}`);
    }
  }
  console.log('private-data-guard self-test passed');
}

if (argv.has('--self-test')) {
  selfTest();
  process.exit(0);
}

const files = listFiles();
const violations = checkFiles(files);

if (violations.length > 0) {
  console.error(`Private-data guard blocked ${mode === 'tracked' ? 'tracked' : 'staged'} files:`);
  for (const { file, label } of violations) {
    console.error(`  ${file} (${label})`);
  }
  console.error('Keep these paths local-only or move redacted examples into examples/.');
  process.exit(1);
}

console.log(`No private-data files ${mode === 'tracked' ? 'tracked' : 'staged'}.`);
