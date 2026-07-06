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
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const query = args.filter(arg => arg !== '--json').join(' ').trim();

if (!query) {
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

function summarizeRow(row, preferredFields) {
  const parts = [];
  for (const field of preferredFields) {
    if (row[field]) parts.push(`${field}=${row[field]}`);
  }
  return parts.join('; ');
}

const needle = normalizeText(query);
const resolvedFiles = Object.fromEntries(
  Object.entries(FILES).map(([key, candidates]) => [key, firstExisting(candidates)])
);

const matches = {
  targets: findTsvMatches(resolvedFiles.targets, needle),
  universe: findTsvMatches(resolvedFiles.universe, needle),
  routes: findTsvMatches(resolvedFiles.routes, needle),
  feedContacts: findTsvMatches(resolvedFiles.feedContacts, needle),
  feedObservations: findTsvMatches(resolvedFiles.feedObservations, needle),
  log: findLineMatches(resolvedFiles.log, needle),
  drafts: findLineMatches(resolvedFiles.drafts, needle),
  dossier: findLineMatches(resolvedFiles.dossier, needle),
  nextBatch: findLineMatches(resolvedFiles.nextBatch, needle),
  operatorCard: findLineMatches(resolvedFiles.operatorCard, needle),
};

const universeStates = new Set(matches.universe.map(row => normalizeText(row.status)));
const universeResponses = new Set(matches.universe.map(row => normalizeText(row.response_state)));
const universeActions = new Set(matches.universe.map(row => normalizeText(row.action_state)));
const targetStates = new Set(matches.targets.map(row => normalizeText(row.status)));
const routeStates = new Set(matches.routes.map(row => normalizeText(row.status)));
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
}

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
