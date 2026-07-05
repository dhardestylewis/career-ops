#!/usr/bin/env node
/**
 * outreach-ledger.mjs — Build the multi-lane outreach universe and queue.
 *
 * Inputs:
 * - data/outreach-targets.tsv
 * - data/outreach-log.md
 * - data/outreach-route-discovery.tsv
 * - data/archive/submission_anthropic_fellows_2026.json
 *
 * Outputs:
 * - data/outreach-universe.tsv
 * - data/outreach-queue.tsv
 *
 * Run:
 *   node src/dataOps/outreach-ledger.mjs
 *   node src/dataOps/outreach-ledger.mjs --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TARGETS_FILE = join(ROOT, 'data/outreach-targets.tsv');
const LOG_FILE = join(ROOT, 'data/outreach-log.md');
const ROUTES_FILE = join(ROOT, 'data/outreach-route-discovery.tsv');
const ARCHIVE_FILE = join(ROOT, 'data/archive/submission_anthropic_fellows_2026.json');
const UNIVERSE_FILE = join(ROOT, 'data/outreach-universe.tsv');
const QUEUE_FILE = join(ROOT, 'data/outreach-queue.tsv');
const DRY_RUN = process.argv.includes('--dry-run');

const LANE_META = {
  'warm-network': { priority: 95, followupDays: 5, template: 'warm-network-note' },
  'warm-academic': { priority: 100, followupDays: 5, template: 'professor-reconnect' },
  'alumni-career-services': { priority: 92, followupDays: 7, template: 'alumni-career-services-note' },
  'hiring-manager': { priority: 90, followupDays: 4, template: 'hiring-manager-note' },
  'recruiter': { priority: 88, followupDays: 3, template: 'recruiter-note' },
  'lab-research': { priority: 86, followupDays: 7, template: 'lab-research-note' },
  'nonprofit-gov': { priority: 84, followupDays: 7, template: 'public-sector-note' },
  'founder-ecosystem': { priority: 82, followupDays: 5, template: 'ecosystem-bridge-note' },
  'dormant-warm': { priority: 80, followupDays: 7, template: 'warm-followup-nudge' },
  'mailbox': { priority: 100, followupDays: 0, template: 'mailbox-discovery' },
};

const STATUS_RANK = {
  'followup_due': 90,
  'ready': 80,
  'research': 70,
  'blocked': 60,
  'watch': 50,
  'seeded': 40,
  'queued': 40,
  'discovered': 35,
  'needs-login': 30,
  'needs_login': 30,
  'sent': 10,
};

const QUEUE_STATES = new Set(['followup_due', 'ready', 'research', 'blocked']);
const TODAY_START = new Date(`${formatDate(new Date())}T00:00:00Z`);

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9@._:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(value) {
  const text = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return new Date(`${text}T00:00:00Z`);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addBusinessDays(date, days) {
  if (!date || !Number.isFinite(days) || days <= 0) return null;
  const result = new Date(date);
  let remaining = Math.floor(days);
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function parseTsv(filePath) {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split('\t').map(normalizeText);
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const values = line.split('\t');
    const row = {};
    for (let i = 0; i < header.length; i++) {
      row[header[i]] = normalizeText(values[i]);
    }
    rows.push(row);
  }
  return rows;
}

function parseMarkdownTable(filePath) {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const tableLines = lines.filter(line => line.trim().startsWith('|'));
  if (tableLines.length < 2) return [];
  const header = tableLines[0]
    .split('|')
    .map(normalizeText)
    .filter(Boolean)
    .map(h => h.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  const rows = [];
  for (const line of tableLines.slice(2)) {
    const values = line.split('|').map(normalizeText).filter(Boolean);
    if (values.length === 0) continue;
    const row = {};
    for (let i = 0; i < header.length; i++) {
      row[header[i]] = normalizeText(values[i]);
    }
    rows.push(row);
  }
  return rows;
}

function parseArchiveSeeds(filePath) {
  if (!existsSync(filePath)) return [];
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const refs = Array.isArray(data.references) ? data.references : [];
  return refs.map((ref, index) => ({
    lane: 'warm-academic',
    scope: 'person',
    contact_name: normalizeText(ref.name),
    organization: normalizeText(ref.background?.split('\n')[0] || data.company || 'Columbia / TACC'),
    channel: 'email',
    source: `data/archive/submission_anthropic_fellows_2026.json#references[${index}]`,
    status: 'seeded',
    priority: '100',
    last_touch: '',
    next_action: 'Reconnect with a short note that names the shared project or research context',
    notes: normalizeText(ref.relationship) || normalizeText(ref.background),
  }));
}

function inferStatusRank(status) {
  return STATUS_RANK[normalizeKey(status)] ?? 0;
}

function laneMeta(lane) {
  return LANE_META[lane] || { priority: 50, followupDays: 5, template: 'general-outreach' };
}

function inferScopeFromText(...parts) {
  const text = parts.map(normalizeText).join(' ').toLowerCase();
  if (!text) return 'person';
  if (/\b(team|office|services|program|lab|institute|school|university|department|center|centre|nonprofit|organization|company|committee|group|collective|alliance|initiative)\b/.test(text)) {
    return 'org';
  }
  return 'person';
}

function recommendedTemplate(lane) {
  return laneMeta(lane).template;
}

function isEmailLike(value) {
  return /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(value || '');
}

function makeDedupKey(row) {
  const name = normalizeKey(row.contact_name || row.person_org || row.organization);
  const scope = normalizeKey(row.scope || '');
  return `scope:${scope}::name:${name}`;
}

function appendUnique(existing, incoming) {
  const left = normalizeText(existing);
  const right = normalizeText(incoming);
  if (!left) return right;
  if (!right) return left;
  if (left === right || left.includes(right)) return left;
  if (right.includes(left)) return right;
  return `${left}; ${right}`;
}

function mergeRecord(existing, incoming) {
  const merged = { ...existing };

  if (inferStatusRank(incoming.status) > inferStatusRank(existing.status)) {
    merged.status = incoming.status;
  }

  if (Number(incoming.priority) > Number(existing.priority || 0)) {
    merged.priority = incoming.priority;
  }

  const existingTouch = parseDate(existing.last_touch);
  const incomingTouch = parseDate(incoming.last_touch);
  if (incomingTouch && (!existingTouch || incomingTouch > existingTouch)) {
    merged.last_touch = incoming.last_touch;
  }

  if (!merged.next_action && incoming.next_action) {
    merged.next_action = incoming.next_action;
  }

  merged.notes = appendUnique(merged.notes, incoming.notes);
  merged.source = appendUnique(merged.source, incoming.source);

  if (!merged.lane && incoming.lane) {
    merged.lane = incoming.lane;
  }

  if (!merged.scope && incoming.scope) {
    merged.scope = incoming.scope;
  }

  if (!merged.contact_name && incoming.contact_name) {
    merged.contact_name = incoming.contact_name;
  }

  if (!merged.organization && incoming.organization) {
    merged.organization = incoming.organization;
  }

  if (!merged.channel && incoming.channel) {
    merged.channel = incoming.channel;
  }

  return merged;
}

function deriveResponseState(status) {
  const key = normalizeKey(status);
  if (['blocked', 'needs-login', 'needs_login'].includes(key)) return 'blocked';
  if (['responded', 'replied', 'meeting', 'scheduled', 'interview', 'intro'].includes(key)) return 'responded';
  if (['sent', 'followup_due', 'watch'].includes(key)) return 'awaiting_reply';
  if (['seeded', 'queued', 'discovered', 'ready', 'research'].includes(key)) return 'not_sent';
  return 'unknown';
}

function buildRows() {
  const rows = [];

  for (const row of parseTsv(TARGETS_FILE)) {
    rows.push({
      lane: row.lane,
      scope: row.scope || inferScopeFromText(row.contact_name, row.organization, row.notes),
      contact_name: row.contact_name,
      organization: row.organization,
      channel: row.channel,
      source: row.source,
      status: row.status || 'seeded',
      priority: row.priority || String(laneMeta(row.lane).priority),
      last_touch: row.last_touch,
      next_action: row.next_action,
      notes: row.notes,
    });
  }

  for (const row of parseMarkdownTable(LOG_FILE)) {
    rows.push({
      lane: row.lane || 'warm-network',
      scope: inferScopeFromText(row.recipient, row.destination, row.template, row.notes),
      contact_name: row.recipient || row.channel || 'unknown',
      organization: row.destination || '',
      channel: row.channel,
      source: 'data/outreach-log.md',
      status: row.status || 'sent',
      priority: String(laneMeta(row.lane || 'warm-network').priority),
      last_touch: row.date,
      next_action: row.status && row.status.toLowerCase() === 'sent'
        ? 'Wait for reply; if none, follow the lane cadence'
        : '',
      notes: appendUnique(row.template, row.notes),
    });
  }

  for (const row of parseTsv(ROUTES_FILE)) {
    rows.push({
      lane: row.lane || 'warm-network',
      scope: inferScopeFromText(row.person_org, row.profile_url, row.notes),
      contact_name: row.person_org,
      organization: row.profile_url || '',
      channel: row.channel,
      source: row.route_url || 'data/outreach-route-discovery.tsv',
      status: row.status || 'discovered',
      priority: String(laneMeta(row.lane || 'warm-network').priority - 1),
      last_touch: row.discovered_on,
      next_action: row.status && row.status.toLowerCase() === 'blocked'
        ? 'Solve the route block before retrying'
        : 'Send the smallest viable message on this route',
      notes: row.notes,
    });
  }

  for (const row of parseArchiveSeeds(ARCHIVE_FILE)) {
    rows.push(row);
  }

  return rows;
}

function enrichRows(rows) {
  const merged = new Map();
  for (const row of rows) {
    const lane = row.lane || 'warm-network';
    const meta = laneMeta(lane);
    const normalized = {
      ...row,
      lane,
      status: row.status || 'seeded',
      priority: row.priority || String(meta.priority),
      recommended_template: recommendedTemplate(lane),
      next_action: row.next_action || 'Send the smallest viable message',
    };
    const key = makeDedupKey(normalized);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...normalized, key });
    } else {
      merged.set(key, mergeRecord(current, { ...normalized, key }));
    }
  }

  return [...merged.values()].map(row => {
    const lane = row.lane || 'warm-network';
    const meta = laneMeta(lane);
    const lastTouch = parseDate(row.last_touch);
    let nextTouch = '';
    let actionState = 'ready';

    if (normalizeKey(row.status) === 'sent' && lastTouch) {
      const due = addBusinessDays(lastTouch, meta.followupDays);
      if (due) nextTouch = formatDate(due);
      actionState = nextTouch ? (due <= TODAY_START ? 'followup_due' : 'watch') : 'watch';
    } else if (normalizeKey(row.status) === 'blocked' || normalizeKey(row.status) === 'needs-login' || normalizeKey(row.status) === 'needs_login') {
      actionState = 'blocked';
    } else if (normalizeKey(row.status) === 'discovered') {
      actionState = 'research';
    } else if (normalizeKey(row.status) === 'seeded' || normalizeKey(row.status) === 'queued') {
      actionState = 'ready';
    } else if (normalizeKey(row.status) === 'sent') {
      actionState = 'watch';
    }

    return {
      ...row,
      priority: String(Number(row.priority || meta.priority)),
      recommended_template: row.recommended_template || recommendedTemplate(lane),
      next_followup_date: nextTouch,
      response_state: row.response_state || deriveResponseState(row.status),
      action_state: actionState,
    };
  });
}

function writeTsv(filePath, headers, rows) {
  const lines = [headers.join('\t')];
  for (const row of rows) {
    lines.push(headers.map(h => normalizeText(row[h])).join('\t'));
  }
  if (!DRY_RUN) {
    writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
  }
}

function sortRows(rows) {
  const stateOrder = { 'followup_due': 0, 'ready': 1, 'research': 2, 'blocked': 3, 'watch': 4 };
  return rows.slice().sort((a, b) => {
    const stateDiff = (stateOrder[a.action_state] ?? 9) - (stateOrder[b.action_state] ?? 9);
    if (stateDiff !== 0) return stateDiff;
    const priDiff = Number(b.priority) - Number(a.priority);
    if (priDiff !== 0) return priDiff;
    return normalizeKey(a.contact_name).localeCompare(normalizeKey(b.contact_name));
  });
}

function summarize(rows) {
  const byLane = new Map();
  const byState = new Map();
  for (const row of rows) {
    byLane.set(row.lane, (byLane.get(row.lane) || 0) + 1);
    byState.set(row.action_state, (byState.get(row.action_state) || 0) + 1);
  }

  console.log('Outreach ledger summary');
  console.log(`Rows: ${rows.length}`);
  console.log('By lane:');
  for (const [lane, count] of [...byLane.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${lane}: ${count}`);
  }
  console.log('By action state:');
  for (const [state, count] of [...byState.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${state}: ${count}`);
  }
}

function main() {
  if (!existsSync(TARGETS_FILE)) {
    console.log('No outreach targets found. Nothing to build.');
    process.exit(0);
  }

  const rows = enrichRows(buildRows());
  const queueRows = sortRows(rows.filter(row => QUEUE_STATES.has(row.action_state)));
  const universeRows = sortRows(rows);

  const universeHeaders = [
    'lane', 'scope', 'contact_name', 'organization', 'channel',
    'status', 'response_state', 'priority', 'last_touch', 'next_followup_date',
    'action_state', 'recommended_template', 'source', 'notes', 'key',
  ];
  const queueHeaders = [
    'lane', 'scope', 'contact_name', 'organization', 'channel',
    'status', 'response_state', 'priority', 'last_touch', 'next_followup_date',
    'action_state', 'recommended_template', 'source', 'notes',
  ];

  writeTsv(UNIVERSE_FILE, universeHeaders, universeRows);
  writeTsv(QUEUE_FILE, queueHeaders, queueRows);

  summarize(queueRows);

  if (DRY_RUN) {
    console.log('(dry-run — no files written)');
  } else {
    console.log(`Wrote ${UNIVERSE_FILE}`);
    console.log(`Wrote ${QUEUE_FILE}`);
  }
}

main();
