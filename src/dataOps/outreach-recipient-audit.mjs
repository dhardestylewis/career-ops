#!/usr/bin/env node
/**
 * outreach-recipient-audit.mjs
 *
 * Search outreach state for a recipient before any live send.
 *
 * Exit codes:
 * 0 = no prior-send evidence; new outreach may be possible
 * 1 = usage or runtime error
 * 2 = prior send / live thread found; do not send a new intro
 * 3 = recipient already exists in draft / research / blocked workflow; resolve that state first
 *
 * Usage:
 *   node src/dataOps/outreach-recipient-audit.mjs "Li-Yun (James) Wang"
 *   node src/dataOps/outreach-recipient-audit.mjs "Li-Yun (James) Wang" --json
 *   node src/dataOps/outreach-recipient-audit.mjs --self-test
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const selfTestMode = args.includes('--self-test');
const query = args.filter(arg => arg !== '--json').join(' ').trim();

if (!query && !selfTestMode) {
  console.error('Usage: node src/dataOps/outreach-recipient-audit.mjs "Recipient Name" [--json]');
  process.exit(1);
}

const FILES = {
  log: ['data/outreach-log.md', 'data/outreach/log.md'],
  targets: ['data/outreach-targets.tsv', 'data/outreach/targets.tsv'],
  universe: ['data/outreach-universe.tsv', 'data/outreach/universe.tsv'],
  routes: ['data/outreach-route-discovery.tsv', 'data/outreach/route-discovery.tsv'],
  drafts: ['data/outreach-drafts.md', 'data/outreach/drafts.md'],
  dossier: ['data/outreach-contact-dossier.md', 'data/outreach/contact-dossier.md'],
  nextBatch: ['data/outreach-next-batch.md', 'data/outreach/next-batch.md'],
  operatorCard: ['data/outreach-operator-card.md', 'data/outreach/operator-card.md'],
  archive: ['data/archive/submission_anthropic_fellows_2026.json'],
  feedContacts: ['data/state/linkedin-feed-contacts.tsv'],
  feedObservations: ['data/state/linkedin-feed-observations.tsv'],
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9@._:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function includesQuery(value, needle) {
  return normalizeText(value).includes(needle);
}

function firstExisting(candidates) {
  for (const rel of candidates) {
    const full = join(ROOT, rel);
    if (existsSync(full)) return full;
  }
  return null;
}

function parseTsv(filePath) {
  if (!filePath || !existsSync(filePath)) return [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split('\t').map(cell => cell.trim());
  return lines.slice(1)
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const values = line.split('\t');
      const row = {};
      for (let i = 0; i < header.length; i++) {
        row[header[i]] = (values[i] || '').trim();
      }
      return row;
    });
}

function findTsvMatches(filePath, needle) {
  return parseTsv(filePath).filter(row => Object.values(row).some(value => includesQuery(value, needle)));
}

function findLineMatches(filePath, needle) {
  if (!filePath || !existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(entry => includesQuery(entry.line, needle));
}

function findJsonMatches(value, needle, path = '$', matches = []) {
  if (value === null || value === undefined) return matches;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (includesQuery(value, needle)) {
      matches.push({ path, value: String(value) });
    }
    return matches;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findJsonMatches(item, needle, `${path}[${index}]`, matches));
    return matches;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      const nextPath = path === '$' ? key : `${path}.${key}`;
      findJsonMatches(nested, needle, nextPath, matches);
    }
  }

  return matches;
}

function findArchiveMatches(filePath, needle) {
  if (!filePath || !existsSync(filePath)) return [];
  try {
    const json = JSON.parse(readFileSync(filePath, 'utf8'));
    const references = Array.isArray(json.references) ? json.references : [];
    const matches = [];
    const seen = new Set();
    const pushMatch = (entry) => {
      const key = `${entry.path}::${entry.value}`;
      if (seen.has(key)) return;
      seen.add(key);
      matches.push(entry);
    };

    for (let index = 0; index < references.length; index++) {
      const reference = references[index] || {};
      const fields = [
        ['name', reference.name],
        ['email', reference.email],
        ['background', reference.background],
        ['relationship', reference.relationship],
      ];

      let matched = false;
      for (const [field, value] of fields) {
        if (includesQuery(value, needle)) {
          matched = true;
          pushMatch({
            path: `references[${index}].${field}`,
            value: String(value),
            canonicalName: normalizeText(reference.name),
            canonicalEmail: normalizeText(reference.email),
          });
        }
      }

      if (matched) {
        if (reference.name) {
          pushMatch({
            path: `references[${index}].name`,
            value: String(reference.name),
            canonicalName: normalizeText(reference.name),
            canonicalEmail: normalizeText(reference.email),
          });
        }
        if (reference.email) {
          pushMatch({
            path: `references[${index}].email`,
            value: String(reference.email),
            canonicalName: normalizeText(reference.name),
            canonicalEmail: normalizeText(reference.email),
          });
        }
      }
    }

    return matches;
  } catch {
    return [];
  }
}

function mergeUniqueEntries(existing, incoming, keyFn) {
  const seen = new Set(existing.map(keyFn));
  for (const item of incoming) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    existing.push(item);
  }
  return existing;
}

function summarizeRow(row, preferredFields) {
  const parts = [];
  for (const field of preferredFields) {
    if (row[field]) parts.push(`${field}=${row[field]}`);
  }
  return parts.join('; ');
}

function deriveDecision(matches) {
  const universeStates = new Set(matches.universe.map(row => normalizeText(row.status)));
  const universeResponses = new Set(matches.universe.map(row => normalizeText(row.response_state)));
  const universeActions = new Set(matches.universe.map(row => normalizeText(row.action_state)));
  const targetStates = new Set(matches.targets.map(row => normalizeText(row.status)));
  const routeStates = new Set(matches.routes.map(row => normalizeText(row.status)));
  const archiveHits = Array.isArray(matches.archive) ? matches.archive : [];
  const logHasSent = matches.log.some(entry => entry.line.includes('| Sent |'));
  const hasReply =
    universeStates.has('replied') ||
    universeStates.has('responded') ||
    universeResponses.has('replied') ||
    universeResponses.has('responded');
  const hasSent = hasReply || universeStates.has('sent') || targetStates.has('sent') || routeStates.has('sent') || logHasSent;
  const hasWorkflowHold =
    universeActions.has('draft') ||
    universeActions.has('blocked') ||
    universeActions.has('research') ||
    targetStates.has('draft') ||
    targetStates.has('queued');
  const hasArchiveContact = archiveHits.length > 0;

  let verdict = 'fresh_outreach_possible';
  let exitCode = 0;
  let nextStep = 'Normal dossier, SPC, and current-role checks still apply.';

  if (hasReply) {
    verdict = 'reply_in_existing_thread';
    exitCode = 2;
    nextStep = 'Do not send a new intro. Continue only in the existing thread.';
  } else if (hasSent) {
    verdict = 'existing_thread_or_prior_send';
    exitCode = 2;
    nextStep = 'Do not send a new intro. Use the existing thread or follow-up cadence only.';
  } else if (hasWorkflowHold) {
    verdict = 'existing_workflow_not_ready';
    exitCode = 3;
    nextStep = 'Do not send yet. Resolve the existing draft / research / blocked state first.';
  } else if (hasArchiveContact) {
    verdict = 'existing_workflow_not_ready';
    exitCode = 3;
    nextStep = 'Do not send yet. The contact already appears in the archive dossier; promote it into the tracked outreach state first.';
  }

  return { verdict, exitCode, nextStep };
}

function runSelfTest() {
  const blank = {
    targets: [],
    universe: [],
    routes: [],
    archive: [],
    feedContacts: [],
    feedObservations: [],
    log: [],
    drafts: [],
    dossier: [],
    nextBatch: [],
    operatorCard: [],
  };

  const cases = [
    {
      name: 'fresh recipient',
      matches: blank,
      expected: { verdict: 'fresh_outreach_possible', exitCode: 0 },
    },
    {
      name: 'existing replied thread',
      matches: {
        ...blank,
        universe: [{ status: 'sent', response_state: 'replied', action_state: 'draft' }],
      },
      expected: { verdict: 'reply_in_existing_thread', exitCode: 2 },
    },
    {
      name: 'prior send without reply',
      matches: {
        ...blank,
        log: [{ line: '| LinkedIn DM | Someone | ... | Sent |', lineNumber: 1 }],
      },
      expected: { verdict: 'existing_thread_or_prior_send', exitCode: 2 },
    },
    {
      name: 'blocked workflow',
      matches: {
        ...blank,
        universe: [{ status: 'blocked', response_state: 'blocked', action_state: 'blocked' }],
      },
      expected: { verdict: 'existing_workflow_not_ready', exitCode: 3 },
    },
    {
      name: 'archive-only contact',
      matches: {
        ...blank,
        archive: [{ path: 'references[0].email', value: 'ppassalacqua@ethz.ch' }],
      },
      expected: { verdict: 'existing_workflow_not_ready', exitCode: 3 },
    },
  ];

  for (const testCase of cases) {
    const actual = deriveDecision(testCase.matches);
    if (actual.verdict !== testCase.expected.verdict || actual.exitCode !== testCase.expected.exitCode) {
      throw new Error(
        `${testCase.name} failed: expected ${testCase.expected.verdict}/${testCase.expected.exitCode}, got ${actual.verdict}/${actual.exitCode}`
      );
    }
  }

  console.log('outreach-recipient-audit self-test passed');
}

if (selfTestMode) {
  runSelfTest();
  process.exit(0);
}

const needle = normalizeText(query);
const resolvedFiles = Object.fromEntries(
  Object.entries(FILES).map(([key, candidates]) => [key, firstExisting(candidates)])
);

const matches = {
  targets: findTsvMatches(resolvedFiles.targets, needle),
  universe: findTsvMatches(resolvedFiles.universe, needle),
  routes: findTsvMatches(resolvedFiles.routes, needle),
  archive: findArchiveMatches(resolvedFiles.archive, needle),
  feedContacts: findTsvMatches(resolvedFiles.feedContacts, needle),
  feedObservations: findTsvMatches(resolvedFiles.feedObservations, needle),
  log: findLineMatches(resolvedFiles.log, needle),
  drafts: findLineMatches(resolvedFiles.drafts, needle),
  dossier: findLineMatches(resolvedFiles.dossier, needle),
  nextBatch: findLineMatches(resolvedFiles.nextBatch, needle),
  operatorCard: findLineMatches(resolvedFiles.operatorCard, needle),
};

const archiveQueries = unique(
  matches.archive
    .flatMap(entry => [entry.canonicalName, entry.canonicalEmail, entry.value])
    .map(normalizeText)
    .filter(Boolean)
);

for (const query of archiveQueries) {
  mergeUniqueEntries(matches.targets, findTsvMatches(resolvedFiles.targets, query), row => JSON.stringify(row));
  mergeUniqueEntries(matches.universe, findTsvMatches(resolvedFiles.universe, query), row => JSON.stringify(row));
  mergeUniqueEntries(matches.routes, findTsvMatches(resolvedFiles.routes, query), row => JSON.stringify(row));
  mergeUniqueEntries(matches.feedContacts, findTsvMatches(resolvedFiles.feedContacts, query), row => JSON.stringify(row));
  mergeUniqueEntries(matches.feedObservations, findTsvMatches(resolvedFiles.feedObservations, query), row => JSON.stringify(row));
  mergeUniqueEntries(matches.log, findLineMatches(resolvedFiles.log, query), entry => JSON.stringify(entry));
  mergeUniqueEntries(matches.drafts, findLineMatches(resolvedFiles.drafts, query), entry => JSON.stringify(entry));
  mergeUniqueEntries(matches.dossier, findLineMatches(resolvedFiles.dossier, query), entry => JSON.stringify(entry));
  mergeUniqueEntries(matches.nextBatch, findLineMatches(resolvedFiles.nextBatch, query), entry => JSON.stringify(entry));
  mergeUniqueEntries(matches.operatorCard, findLineMatches(resolvedFiles.operatorCard, query), entry => JSON.stringify(entry));
}

const { verdict, exitCode, nextStep } = deriveDecision(matches);

const summary = {
  query,
  verdict,
  exitCode,
  nextStep,
  files: resolvedFiles,
  evidence: {
    targets: matches.targets.map(row => summarizeRow(row, ['contact_name', 'status', 'next_action', 'notes'])),
    universe: matches.universe.map(row => summarizeRow(row, ['contact_name', 'status', 'response_state', 'action_state', 'next_followup_date', 'notes'])),
    routes: matches.routes.map(row => summarizeRow(row, ['person_org', 'channel', 'status', 'notes'])),
    archive: matches.archive.map(entry => `${entry.path}=${entry.value}`),
    log: matches.log.slice(0, 5).map(entry => `line ${entry.lineNumber}: ${entry.line.trim()}`),
    drafts: matches.drafts.slice(0, 5).map(entry => `line ${entry.lineNumber}: ${entry.line.trim()}`),
    dossier: matches.dossier.slice(0, 5).map(entry => `line ${entry.lineNumber}: ${entry.line.trim()}`),
    nextBatch: matches.nextBatch.slice(0, 5).map(entry => `line ${entry.lineNumber}: ${entry.line.trim()}`),
    operatorCard: matches.operatorCard.slice(0, 5).map(entry => `line ${entry.lineNumber}: ${entry.line.trim()}`),
    feedContacts: matches.feedContacts.map(row => summarizeRow(row, ['person_org', 'follow_up', 'notes'])),
    feedObservations: matches.feedObservations.map(row => summarizeRow(row, ['person_org', 'what_it_looks_like', 'follow_up', 'notes'])),
  },
};

if (jsonMode) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(exitCode);
}

console.log(`Recipient audit: ${summary.query}`);
console.log(`Verdict: ${summary.verdict}`);
console.log(`Next step: ${summary.nextStep}`);

const sections = [
  ['Universe', summary.evidence.universe],
  ['Targets', summary.evidence.targets],
  ['Routes', summary.evidence.routes],
  ['Archive', summary.evidence.archive],
  ['Log', summary.evidence.log],
  ['Drafts', summary.evidence.drafts],
  ['Dossier', summary.evidence.dossier],
  ['Next batch', summary.evidence.nextBatch],
  ['Operator card', summary.evidence.operatorCard],
  ['Feed observations', summary.evidence.feedObservations],
];

for (const [label, entries] of sections) {
  if (!entries.length) continue;
  console.log(`\n${label}:`);
  for (const entry of entries) {
    console.log(`- ${entry}`);
  }
}

process.exit(exitCode);
