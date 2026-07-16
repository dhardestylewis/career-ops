#!/usr/bin/env node

import { createHash, randomUUID } from 'crypto';
import { closeSync, existsSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const GLOBAL_RELATIONSHIP_REGISTRY = process.env.CODEX_OUTREACH_RELATIONSHIP_REGISTRY
  || join(homedir(), '.codex', 'outreach-relationships.tsv');
export const GLOBAL_APPROVAL_LEDGER = process.env.CODEX_OUTREACH_APPROVAL_LEDGER
  || join(homedir(), '.codex', 'outreach-approvals.tsv');
export const LOCAL_RELATIONSHIP_REGISTRY = join(ROOT, 'data/outreach/relationship-registry.tsv');

export const APPROVAL_HEADERS = [
  'approval_id', 'recipient', 'organization', 'lane', 'channel', 'message_sha256',
  'approved_at', 'expires_at', 'status', 'chat_reference', 'consumed_at',
];

function normalizeText(value) {
  return String(value ?? '').trim();
}

export function normalizeKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9@._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMessage(value) {
  return normalizeText(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function messageSha256(value) {
  return createHash('sha256').update(normalizeMessage(value), 'utf8').digest('hex');
}

export function parseTsvContent(content) {
  const lines = String(content || '').split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return [];
  const headers = lines[0].split('\t').map(normalizeText);
  return lines.slice(1)
    .filter(line => !line.trim().startsWith('#'))
    .map(line => {
      const values = line.split('\t');
      return Object.fromEntries(headers.map((header, index) => [header, normalizeText(values[index])]));
    });
}

export function readTsv(filePath) {
  if (!filePath || !existsSync(filePath)) return [];
  return parseTsvContent(readFileSync(filePath, 'utf8'));
}

function serializeTsv(headers, rows) {
  const clean = value => normalizeText(value).replace(/[\t\r\n]+/g, ' ');
  return [headers.join('\t'), ...rows.map(row => headers.map(header => clean(row[header])).join('\t'))].join('\n') + '\n';
}

function aliasList(row) {
  return [row.subject, ...(row.aliases || '').split(/[;|]/)]
    .map(normalizeKey)
    .filter(alias => alias.length >= 3);
}

function contextHaystacks(context) {
  return [
    context.recipient,
    context.organization,
    context.email,
    context.subject,
    context.message,
    context.heading,
  ].map(normalizeKey).filter(Boolean);
}

function containsAlias(haystack, alias) {
  if (!haystack || !alias) return false;
  if (alias.includes('@') || alias.includes('.') || alias.includes('-')) return haystack.includes(alias);
  return (` ${haystack} `).includes(` ${alias} `);
}

export function loadRelationshipRegistry() {
  const rows = [];
  for (const filePath of [GLOBAL_RELATIONSHIP_REGISTRY, LOCAL_RELATIONSHIP_REGISTRY]) {
    for (const row of readTsv(filePath)) rows.push({ ...row, registry_file: filePath });
  }
  return rows;
}

export function matchProtectedRelationships(context, registryRows = loadRelationshipRegistry()) {
  const haystacks = contextHaystacks(context);
  return registryRows.filter(row => {
    if (!/^(protected|manual_approval_required|no_contact)$/i.test(normalizeText(row.send_policy))) return false;
    return aliasList(row).some(alias => haystacks.some(haystack => containsAlias(haystack, alias)));
  });
}

function relationshipSignalText(context) {
  return normalizeKey([
    context.relationship,
    context.relationshipStatus,
    context.threadState,
    context.history,
    context.relationshipNotes,
  ].filter(Boolean).join(' '));
}

export function classifyRelationship(context, registryRows = loadRelationshipRegistry()) {
  const registryMatches = matchProtectedRelationships(context, registryRows);
  if (registryMatches.some(row => /^no_contact$/i.test(row.send_policy))) {
    return { status: 'no_contact', registryMatches, reason: 'protected registry says no contact' };
  }
  if (registryMatches.length) {
    return { status: 'established', registryMatches, reason: 'protected relationship registry match' };
  }

  const explicit = normalizeKey(context.relationshipStatus);
  const signals = relationshipSignalText(context);
  const establishedSignal = /\b(established|existing|warm|known|active thread|prior thread|prior reply|replied|inbound|former|friend|colleague|classmate|professor|instructor|advisor|mentor|client|customer|worked with|shared history|1st degree|first degree)\b/.test(signals);

  if (establishedSignal || /^(established|known|warm|existing)$/.test(explicit)) {
    return { status: 'established', registryMatches, reason: 'relationship history indicates an established relationship' };
  }
  if (/^(cold|new|none|no prior relationship)$/.test(explicit)) {
    return { status: 'cold', registryMatches, reason: 'explicitly classified cold after relationship check' };
  }
  return { status: 'unknown', registryMatches, reason: 'relationship status is missing or unresolved' };
}

function parseInstant(value) {
  const date = new Date(normalizeText(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function findApproval(context, approvalRows, now = new Date()) {
  const hash = messageSha256(context.message);
  const requestedId = normalizeText(context.approvalId);
  const candidates = approvalRows.filter(row => {
    if (requestedId && normalizeText(row.approval_id) !== requestedId) return false;
    if (normalizeText(row.message_sha256).toLowerCase() !== hash) return false;
    if (normalizeKey(row.recipient) !== normalizeKey(context.recipient)) return false;
    if (normalizeKey(row.organization) !== normalizeKey(context.organization)) return false;
    if (normalizeKey(row.lane) !== normalizeKey(context.lane)) return false;
    if (normalizeKey(row.channel) !== normalizeKey(context.channel)) return false;
    return true;
  });

  for (const row of candidates) {
    if (!/^active$/i.test(normalizeText(row.status))) continue;
    if (!normalizeText(row.chat_reference)) continue;
    const approvedAt = parseInstant(row.approved_at);
    const expiresAt = parseInstant(row.expires_at);
    if (!approvedAt || !expiresAt) continue;
    if (expiresAt <= now) continue;
    if (expiresAt.getTime() - approvedAt.getTime() > 24 * 60 * 60 * 1000) continue;
    return row;
  }
  return null;
}

export function inspectOutreachSend(context, options = {}) {
  const registryRows = options.registryRows || loadRelationshipRegistry();
  const approvalRows = options.approvalRows || readTsv(GLOBAL_APPROVAL_LEDGER);
  const classification = classifyRelationship(context, registryRows);
  const errors = [];
  let approval = null;

  for (const [field, value] of [
    ['recipient', context.recipient],
    ['organization', context.organization],
    ['lane', context.lane],
    ['channel', context.channel],
    ['relationshipStatus', context.relationshipStatus],
  ]) {
    if (!normalizeText(value)) errors.push(`Required send scope is missing ${field}.`);
  }
  if (!normalizeMessage(context.message)) errors.push('The exact message body is required.');
  if (classification.status === 'no_contact') {
    errors.push('Recipient or organization is marked no-contact. Do not draft or send.');
  } else if (classification.status === 'unknown') {
    errors.push('Relationship status is unknown. Check CRM, inbox, LinkedIn thread history, and the protected registry; classify as cold or established before sending.');
  } else if (classification.status === 'established') {
    if (!normalizeText(context.approvalId)) {
      errors.push('Established relationship dossier is missing approval_id from the current chat.');
    } else {
      approval = findApproval(context, approvalRows, options.now || new Date());
    }
    if (normalizeText(context.approvalId) && !approval) {
      errors.push(`Established relationship requires current-chat approval tied to this exact message (sha256 ${messageSha256(context.message)}).`);
    }
  }

  return {
    allowed: errors.length === 0,
    errors,
    classification,
    approval,
    messageSha256: messageSha256(context.message),
  };
}

function consumeApproval(approval, filePath = GLOBAL_APPROVAL_LEDGER, now = new Date()) {
  if (!approval || !existsSync(filePath)) throw new Error('Active approval ledger is missing; refusing to send.');
  const lockPath = `${filePath}.lock`;
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  let lockHandle = null;
  try {
    lockHandle = openSync(lockPath, 'wx');
    const rows = readTsv(filePath);
    const approvalId = normalizeText(approval.approval_id);
    const current = rows.find(row => normalizeText(row.approval_id) === approvalId);
    if (!current || !/^active$/i.test(normalizeText(current.status))) {
      throw new Error(`Approval ${approvalId} is no longer active; refusing duplicate or concurrent send.`);
    }
    const updated = rows.map(row => normalizeText(row.approval_id) === approvalId
      ? { ...row, status: 'consumed', consumed_at: now.toISOString() }
      : row);
    writeFileSync(tempPath, serializeTsv(APPROVAL_HEADERS, updated), 'utf8');
    renameSync(tempPath, filePath);
  } finally {
    if (existsSync(tempPath)) unlinkSync(tempPath);
    if (lockHandle !== null) closeSync(lockHandle);
    if (lockHandle !== null && existsSync(lockPath)) unlinkSync(lockPath);
  }
}

export function assertOutreachSendAllowed(context, options = {}) {
  const result = inspectOutreachSend(context, options);
  if (!result.allowed) {
    const error = new Error(`OUTREACH SEND BLOCKED: ${result.errors.join(' ')}`);
    error.code = 'OUTREACH_SEND_BLOCKED';
    error.details = result;
    throw error;
  }
  if (options.consumeApproval && result.approval) consumeApproval(result.approval, GLOBAL_APPROVAL_LEDGER, options.now || new Date());
  return result;
}

export async function guardedGmailMessageSend({ gmail, sendArgs, context }) {
  assertOutreachSendAllowed(context, { consumeApproval: true });
  return gmail.users.messages.send(sendArgs);
}

export async function guardedGmailDraftSend({ gmail, sendArgs, context }) {
  assertOutreachSendAllowed(context, { consumeApproval: true });
  return gmail.users.drafts.send(sendArgs);
}

export function blockLegacyDirectOutreachSend(scriptUrl) {
  const script = normalizeText(scriptUrl).split(/[\\/]/).pop();
  throw new Error(
    `OUTREACH SEND BLOCKED: ${script} is a legacy direct-send script and cannot be executed. `
    + 'Stage the exact message, classify the relationship, run outreach preflight, and use a guarded sender. '
    + 'Established relationships also require explicit approval in the current chat.'
  );
}

export function createApprovalRecord({ recipient, organization, lane, channel, message, chatReference, hours = 24, approvalId = '' }, now = new Date()) {
  for (const [field, value] of [['recipient', recipient], ['organization', organization], ['lane', lane], ['channel', channel], ['message', message], ['chatReference', chatReference]]) {
    if (!normalizeText(value)) throw new Error(`Cannot create approval: ${field} is required.`);
  }
  const duration = Math.min(Math.max(Number(hours) || 24, 0.25), 24);
  return {
    approval_id: approvalId || `outreach-${now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomUUID().slice(0, 8)}`,
    recipient: normalizeText(recipient),
    organization: normalizeText(organization),
    lane: normalizeText(lane),
    channel: normalizeText(channel),
    message_sha256: messageSha256(message),
    approved_at: now.toISOString(),
    expires_at: new Date(now.getTime() + duration * 60 * 60 * 1000).toISOString(),
    status: 'active',
    chat_reference: normalizeText(chatReference),
    consumed_at: '',
  };
}

export function appendApprovalRecord(record, filePath = GLOBAL_APPROVAL_LEDGER) {
  const rows = readTsv(filePath);
  if (rows.some(row => normalizeText(row.approval_id) === normalizeText(record.approval_id))) {
    throw new Error(`Approval id already exists: ${record.approval_id}`);
  }
  writeFileSync(filePath, serializeTsv(APPROVAL_HEADERS, [...rows, record]), 'utf8');
}

export function runSelfTest() {
  const registryRows = [{
    subject_type: 'organization',
    subject: 'Mach9',
    aliases: 'mach9.io',
    relationship_status: 'established',
    send_policy: 'manual_approval_required',
  }];
  const now = new Date('2026-07-16T12:00:00Z');
  const message = 'Hi Alexander - exact approved copy.';
  const approval = createApprovalRecord({
    recipient: 'Alexander Baikovitz',
    organization: 'Mach9',
    lane: 'candidate-seeking',
    channel: 'LinkedIn DM',
    message,
    chatReference: 'current chat explicit approval',
    approvalId: 'test-approval',
  }, now);

  const blocked = inspectOutreachSend({
    recipient: 'Alexander Baikovitz', organization: 'Mach9', lane: 'candidate-seeking', channel: 'LinkedIn DM', message, relationshipStatus: 'cold',
  }, { registryRows, approvalRows: [], now });
  if (blocked.allowed || blocked.classification.status !== 'established') throw new Error('Protected organization was not blocked.');

  const approved = inspectOutreachSend({
    recipient: 'Alexander Baikovitz', organization: 'Mach9', lane: 'candidate-seeking', channel: 'LinkedIn DM', message, relationshipStatus: 'cold', approvalId: 'test-approval',
  }, { registryRows, approvalRows: [approval], now });
  if (!approved.allowed) throw new Error(`Exact active approval did not pass: ${approved.errors.join(' ')}`);

  const changed = inspectOutreachSend({
    recipient: 'Alexander Baikovitz', organization: 'Mach9', lane: 'candidate-seeking', channel: 'LinkedIn DM', message: `${message} Changed.`, relationshipStatus: 'established', approvalId: 'test-approval',
  }, { registryRows, approvalRows: [approval], now });
  if (changed.allowed) throw new Error('Changed message reused an approval.');

  const unknown = inspectOutreachSend({ recipient: 'New Person', organization: 'New Org', lane: 'candidate-seeking', channel: 'email', message: 'Hello.' }, { registryRows: [], approvalRows: [], now });
  if (unknown.allowed) throw new Error('Unknown relationship was not blocked.');

  const cold = inspectOutreachSend({ recipient: 'New Person', organization: 'New Org', lane: 'candidate-seeking', channel: 'email', message: 'Hello.', relationshipStatus: 'cold' }, { registryRows: [], approvalRows: [], now });
  if (!cold.allowed) throw new Error('Explicit cold relationship was unexpectedly blocked.');

  console.log('outreach-send-gate self-test passed');
}

if (process.argv.includes('--self-test')) runSelfTest();
