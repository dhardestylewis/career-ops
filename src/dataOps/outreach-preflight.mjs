#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { inspectOutreachSend } from '../core/outreach-send-gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_PACKET = 'data/outreach/terra-ai-send-packet.md';
const DEFAULT_DOSSIER = 'data/outreach/contact-dossier.md';
const DEFAULT_DRAFTS = 'data/outreach/drafts.md';
const DEFAULT_LOG = 'data/outreach/log.md';
const MIN_FOLLOWUP_BUSINESS_DAYS = 3;
const DEFAULT_FOLLOWUP_BUSINESS_DAYS = 5;
const TODAY_START = startOfUtcDay(new Date());
const GENERIC_TEMPLATE_MARKERS = [
  'quick update',
  'quick note',
  'wanted to send a quick',
  'tightening',
  'routing around',
  'follow-on routing',
  'project pitch lane',
  'commercialization support',
  'best columbia route',
  'mix of academic and applied work',
  'good sense for the right',
  'lane around it',
];

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function titleCaseToken(token) {
  return normalizeText(token).replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
}

function extractFirstName(name) {
  const stop = new Set(['dr', 'phd', 'md', 'mr', 'mrs', 'ms', 'prof', 'professor', 'team']);
  const tokens = normalizeText(name)
    .split(/\s+/)
    .map(titleCaseToken)
    .filter(Boolean);
  for (const token of tokens) {
    if (!stop.has(token.toLowerCase())) return token;
  }
  return tokens[0] || '';
}

function normalizeMessageBody(value) {
  return normalizeKey(value).replace(/\s+/g, ' ').trim();
}

function hasGenericTemplateLanguage(body) {
  const text = normalizeMessageBody(body);
  return GENERIC_TEMPLATE_MARKERS.some(marker => text.includes(normalizeMessageBody(marker)));
}

function isExplicitSpcNoMatch(value) {
  const text = normalizeKey(value);
  if (!text) return false;
  return /\b(no match|no exact name hit|no exact hit|no exact match|clean no match|not affiliated|not spc affiliated|not spc adjacent|no relation|directory pdf no match|directory export no match|pdf decisive|user confirmed no relation)\b/i.test(text);
}

function isSpcAffiliationBlocked(value) {
  const text = normalizeKey(value);
  if (!text) return false;
  if (isExplicitSpcNoMatch(text)) return false;
  return /\b(yes|member|affiliate|affiliated|unclear|unknown|blocked|adjacent)\b/i.test(text);
}

function extractRecipientName(value) {
  return normalizeText(value).replace(/\s*<[^>]+>\s*$/, '');
}

function parseArgs(argv) {
  const args = {
    packet: DEFAULT_PACKET,
    dossier: DEFAULT_DOSSIER,
    drafts: DEFAULT_DRAFTS,
    log: DEFAULT_LOG,
    selfTest: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--packet') args.packet = argv[++i];
    else if (arg === '--dossier') args.dossier = argv[++i];
    else if (arg === '--drafts') args.drafts = argv[++i];
    else if (arg === '--log') args.log = argv[++i];
    else if (arg === '--self-test') args.selfTest = true;
  }
  return args;
}

function resolvePath(pathLike) {
  return join(ROOT, pathLike);
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  const text = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return new Date(`${text}T00:00:00Z`);
}

function extractDateToken(value) {
  const match = normalizeText(value).match(/\d{4}-\d{2}-\d{2}/);
  return match ? parseDate(match[0]) : null;
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

function isFollowupPacketPath(pathLike) {
  return /follow[-_ ]?up|nudge|bump/i.test(normalizeText(pathLike));
}

function parsePacket(content) {
  const statusMatch = content.match(/^Status:\s*(.+)$/m);
  const status = normalizeText(statusMatch?.[1]);
  const messages = [];
  const headingRegex = /^###\s+(.+)$/gm;
  const headings = [...content.matchAll(headingRegex)];

  for (let i = 0; i < headings.length; i++) {
    const heading = normalizeText(headings[i][1]);
    const start = headings[i].index + headings[i][0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index : content.length;
    const raw = content.slice(start, end).trim();
    const lines = raw.split(/\r?\n/);
    const bodyStart = lines.findIndex(line => normalizeText(line) && !line.trim().startsWith('- '));
    const body = bodyStart === -1 ? '' : lines.slice(bodyStart).join('\n').trim();
    messages.push({
      heading,
      body,
      firstName: extractFirstName(heading),
      headingKey: normalizeKey(heading),
    });
  }

  return { status, messages };
}

function parseMarkdownTableContent(content) {
  const rows = [];
  let block = [];

  const flush = () => {
    if (block.length < 2) {
      block = [];
      return;
    }

    const header = block[0]
      .split('|')
      .map(normalizeText)
      .filter(Boolean)
      .map(h => h.toLowerCase().replace(/[^a-z0-9]+/g, '_'));

    for (const line of block.slice(2)) {
      const values = line.split('|').map(normalizeText).filter(Boolean);
      if (!values.length) continue;
      const row = {};
      for (let i = 0; i < header.length; i++) {
        row[header[i]] = normalizeText(values[i]);
      }
      rows.push(row);
    }

    block = [];
  };

  for (const line of String(content || '').split(/\r?\n/)) {
    if (line.trim().startsWith('|')) {
      block.push(line);
    } else {
      flush();
    }
  }
  flush();
  return rows;
}

function parseMarkdownTable(filePath) {
  if (!existsSync(filePath)) return [];
  return parseMarkdownTableContent(readFileSync(filePath, 'utf8'));
}

function parseDraftMirrorContent(content) {
  const sections = [];
  const source = String(content || '');
  const headings = [...source.matchAll(/^##\s+(.+)$/gm)];

  for (let i = 0; i < headings.length; i++) {
    const heading = normalizeText(headings[i][1]);
    const start = headings[i].index + headings[i][0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index : source.length;
    const raw = source.slice(start, end).trim();
    const toMatch = raw.match(/^\*\*To:\*\*\s*(.+)$/m);
    const statusMatch = raw.match(/^\*\*Status:\*\*\s*(.+)$/m);
    const fenceMatch = raw.match(/```(?:text)?\s*([\s\S]*?)```/i);
    const recipient = extractRecipientName(toMatch?.[1] || '');
    const body = normalizeText(fenceMatch?.[1] || '');
    sections.push({
      heading,
      recipient,
      recipientKey: normalizeKey(recipient || heading),
      status: normalizeText(statusMatch?.[1] || ''),
      body,
      bodyKey: normalizeMessageBody(body),
    });
  }

  return sections;
}

function parseDraftMirror(filePath) {
  if (!existsSync(filePath)) return [];
  return parseDraftMirrorContent(readFileSync(filePath, 'utf8'));
}

function parseDossiers(content) {
  const blocks = [];
  const regex = /^contact:\s*(.+)$/gm;
  const matches = [...content.matchAll(regex)];
  for (let i = 0; i < matches.length; i++) {
    const contact = normalizeText(matches[i][1]);
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    const block = content.slice(start, end);
    const pick = (field) => normalizeText(block.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]);
    blocks.push({
      contact,
      key: normalizeKey(contact),
      status: pick('status'),
      sourceRefs: pick('source_refs'),
      threadHistory: pick('thread_history'),
      publicArtifacts: pick('public_artifacts'),
      internalProofPoint: pick('internal_proof_point'),
      lastTouch: pick('last_touch'),
      nextFollowup: pick('next_followup'),
      whyNow: pick('why_now'),
      hook: pick('hook'),
      proofPoint: pick('proof_point'),
      ask: pick('ask'),
      organization: pick('organization'),
      lane: pick('lane'),
      channel: pick('channel'),
      relationship: pick('relationship'),
      relationshipStatus: pick('relationship_status'),
      relationshipNotes: pick('relationship_notes'),
      approvalId: pick('approval_id'),
      spcAffiliation: pick('spc_affiliation'),
      spcCheckedAt: pick('spc_checked_at'),
    });
  }
  return blocks;
}

function isWorkPitch(text) {
  return /\b(apply|applying|applied|role|hiring|hire|job|position|search|recruit|team)\b/i.test(text);
}

function greetingTarget(body) {
  const firstLine = body.split(/\r?\n/).find(line => normalizeText(line)) || '';
  const match = firstLine.match(/^(hi|hello)\s+([^,!\-\n]+)/i);
  return normalizeText(match?.[2] || '');
}

function hasEstablishedLogRelationship(message, liveLogRows) {
  const key = normalizeKey(message.heading);
  const first = normalizeKey(message.firstName);
  return liveLogRows.some(row => {
    const recipient = normalizeKey(row.recipient || row.contact || row.contact_name || row.person || '');
    if (!recipient || !(recipient === key || recipient.includes(key) || key.includes(recipient) || (first && recipient.includes(first)))) return false;
    const history = normalizeKey(Object.values(row).join(' '));
    return /\b(reply|replied|responded|inbound|meeting|scheduled|warm|existing thread|active thread)\b/.test(history);
  });
}

function validatePacket(packet, dossiers, mirrors = {}, packetPath = '') {
  const errors = [];
  const warnings = [];
  const draftSections = Array.isArray(mirrors.drafts) ? mirrors.drafts : [];
  const liveSentKeys = mirrors.liveSentKeys instanceof Set ? mirrors.liveSentKeys : new Set();
  const liveLogRows = Array.isArray(mirrors.liveLogRows) ? mirrors.liveLogRows : [];
  const draftByRecipient = new Map();
  const seenDraftRecipients = new Map();

  if (!packet.messages.length) {
    errors.push('No `### Recipient` message blocks found in the send packet.');
    return { errors, warnings };
  }

  if (/\b(held|blocked|research)\b/i.test(packet.status)) {
    errors.push(`Packet status is not sendable: "${packet.status || 'missing'}".`);
  }

  const firstNames = unique(packet.messages.map(message => normalizeKey(message.firstName)));
  const normalizedBodies = new Map();
  const seenPacketRecipients = new Map();

  for (const draft of draftSections) {
    if (!draft.recipientKey) continue;
    const priorDraft = seenDraftRecipients.get(draft.recipientKey);
    if (priorDraft) {
      errors.push(`${draft.recipient || draft.heading}: draft mirror duplicates ${priorDraft.recipient || priorDraft.heading}.`);
      continue;
    }
    seenDraftRecipients.set(draft.recipientKey, draft);
    draftByRecipient.set(draft.recipientKey, draft);
  }

  for (const message of packet.messages) {
    const body = message.body;
    if (!body) {
      errors.push(`${message.heading}: message body is empty.`);
      continue;
    }

    const packetKey = normalizeKey(message.heading);
    const packetHeading = seenPacketRecipients.get(packetKey);
    if (packetHeading) {
      errors.push(`${message.heading}: packet contains duplicate recipient headings (${packetHeading}).`);
    } else {
      seenPacketRecipients.set(packetKey, message.heading);
    }

    if (/\[[^\]]+\]/.test(body)) {
      errors.push(`${message.heading}: unresolved placeholder detected in body.`);
    }

    const greeting = greetingTarget(body);
    const greetingKey = normalizeKey(extractFirstName(greeting));
    const expectedKey = normalizeKey(message.firstName);
    if (greeting && greetingKey && expectedKey && greetingKey !== expectedKey) {
      errors.push(`${message.heading}: greeting targets "${greeting}" instead of the intended recipient.`);
    }

    for (const other of packet.messages) {
      if (other.heading === message.heading) continue;
      const otherFirst = normalizeKey(other.firstName);
      if (!otherFirst) continue;
      const crossGreeting = new RegExp(`^(hi|hello)\\s+${other.firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'im');
      if (crossGreeting.test(body)) {
        errors.push(`${message.heading}: body greets another packet recipient (${other.heading}).`);
      } else if (body.includes(other.heading)) {
        errors.push(`${message.heading}: body contains another packet recipient's full name (${other.heading}).`);
      } else if (firstNames.includes(otherFirst) && new RegExp(`\\b${other.firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body) && !new RegExp(`\\b${message.firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body)) {
        errors.push(`${message.heading}: body mentions another recipient's first name without naming the intended recipient.`);
      }
    }

    const normalizedBody = normalizeKey(body);
    const priorOwner = normalizedBodies.get(normalizedBody);
    if (priorOwner && priorOwner !== message.heading) {
      warnings.push(`${message.heading}: message body is identical to ${priorOwner}.`);
    } else {
      normalizedBodies.set(normalizedBody, message.heading);
    }

    const dossier = dossiers.find(entry => entry.key === packetKey);
    if (!dossier) {
      errors.push(`${message.heading}: no exact contact dossier found; relationship state cannot be verified.`);
      continue;
    }

    if (!/\bready\b/i.test(dossier.status)) {
      errors.push(`${message.heading}: dossier status is "${dossier.status || 'missing'}", not ready.`);
    }

    for (const [field, value] of [
      ['source_refs', dossier.sourceRefs],
      ['thread_history', dossier.threadHistory],
      ['organization', dossier.organization],
      ['lane', dossier.lane],
      ['channel', dossier.channel],
      ['relationship', dossier.relationship],
      ['relationship_status', dossier.relationshipStatus],
      ['why_now', dossier.whyNow],
      ['hook', dossier.hook],
      ['proof_point', dossier.proofPoint],
      ['ask', dossier.ask],
    ]) {
      if (!value) errors.push(`${message.heading}: dossier is missing ${field}.`);
    }

    if (hasGenericTemplateLanguage(body)) {
      errors.push(`${message.heading}: body contains boilerplate template language; rewrite it from the actual thread or source hook.`);
    }

    const logShowsEstablishedRelationship = hasEstablishedLogRelationship(message, liveLogRows);
    const relationshipCheck = inspectOutreachSend({
      recipient: message.heading,
      heading: message.heading,
      organization: dossier.organization,
      lane: dossier.lane,
      channel: dossier.channel,
      message: body,
      relationship: dossier.relationship,
      relationshipStatus: logShowsEstablishedRelationship ? 'established' : dossier.relationshipStatus,
      relationshipNotes: dossier.relationshipNotes,
      history: logShowsEstablishedRelationship ? 'existing thread with reply or live relationship evidence' : '',
      approvalId: dossier.approvalId,
    }, {
      registryRows: mirrors.registryRows,
      approvalRows: mirrors.approvalRows,
      now: mirrors.now,
    });
    for (const error of relationshipCheck.errors) {
      errors.push(`${message.heading}: ${error}`);
    }

    if (isWorkPitch(body)) {
      if (!dossier.spcAffiliation) errors.push(`${message.heading}: SPC affiliation check is missing.`);
      if (!dossier.spcCheckedAt) errors.push(`${message.heading}: SPC checked date is missing.`);
      if (isSpcAffiliationBlocked(dossier.spcAffiliation)) {
        errors.push(`${message.heading}: SPC status "${dossier.spcAffiliation}" blocks a work pitch.`);
      }
    }

    const isFollowupPacket = isFollowupPacketPath(packetPath);
    if (isFollowupPacket) {
      const lastTouch = extractDateToken(dossier.lastTouch);
      const nextFollowup = extractDateToken(dossier.nextFollowup);

      if (!lastTouch) {
        errors.push(`${message.heading}: follow-up packet is missing a parseable last_touch date.`);
      }
      if (!dossier.threadHistory) {
        errors.push(`${message.heading}: follow-up packet is missing thread_history from the real thread or DM history.`);
      }
      if (!nextFollowup) {
        errors.push(`${message.heading}: follow-up packet is missing a parseable next_followup date.`);
      }
      if (nextFollowup && TODAY_START < nextFollowup) {
        errors.push(`${message.heading}: follow-up is not due until ${formatDate(nextFollowup)}.`);
      }
      if (lastTouch) {
        const minimumDate = addBusinessDays(lastTouch, MIN_FOLLOWUP_BUSINESS_DAYS);
        if (minimumDate && TODAY_START < minimumDate) {
          errors.push(`${message.heading}: follow-up is too soon; wait at least ${MIN_FOLLOWUP_BUSINESS_DAYS} business days after ${formatDate(lastTouch)}. Default cadence is ${DEFAULT_FOLLOWUP_BUSINESS_DAYS} business days.`);
        }
      }
    }

    const draft = draftByRecipient.get(packetKey);
    if (draft) {
      const draftBodyKey = draft.bodyKey || normalizeMessageBody(draft.body);
      const draftStatusSent = /^sent\b/i.test(draft.status);
      const liveAlreadySent = liveSentKeys.has(packetKey);

      if (draftBodyKey && normalizedBody === draftBodyKey && (draftStatusSent || liveAlreadySent)) {
        errors.push(`${message.heading}: duplicate send detected; the packet body matches the sent draft mirror.`);
      }

      if (draftStatusSent && !liveAlreadySent) {
        errors.push(`${message.heading}: draft mirror says sent, but the live log does not contain a matching sent row.`);
      }
    } else if (liveSentKeys.has(packetKey)) {
      warnings.push(`${message.heading}: recipient already appears in the live log, but no draft mirror entry was found.`);
    }
  }

  return { errors: unique(errors), warnings: unique(warnings) };
}

function runSelfTest() {
  const goodPacket = parsePacket(`
Status: ready to send

### Julia Kreutzer

Hi Julia - I saw your work at Cohere Labs and MILA. I'm building Homecastr's forecasting and evaluation stack, and I'd love to stay in touch if that overlap feels interesting.
`);
  const goodDossiers = parseDossiers(`
contact: Julia Kreutzer
source_refs: Gmail thread history; Cohere Labs and MILA public profiles
thread_history: Prior outbound and inbound thread in email
public_artifacts: Cohere Labs profile; MILA profile
internal_proof_point: Homecastr forecasting and evaluation stack
organization: Cohere Labs
channel: LinkedIn connection note
lane: candidate-seeking
relationship: no prior relationship found after person and organization audit
relationship_status: cold
why_now: A live Beginners journey session creates a concrete reason to reconnect.
hook: Her current Cohere Labs and MILA research path is the specific bridge.
proof_point: Homecastr forecasting and evaluation work is the supporting proof point.
ask: Stay in touch and compare notes briefly.
status: ready to send
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07
`);
  const goodDrafts = parseDraftMirrorContent(`
## Julia Kreutzer

**To:** Julia Kreutzer <julia@example.com>

**Status:** Draft

**Subject:** Example reconnect

\`\`\`text
Hi Julia - I saw your work at Cohere Labs and MILA. I'm building Homecastr's forecasting and evaluation stack, and I'd love to stay in touch if that overlap feels interesting.
\`\`\`
`);
  const goodLog = parseMarkdownTableContent(`
| Channel | Recipient | Destination | Template | Subject / Context | Status | Notes |
|---|---|---|---|---|---|---|
| Email | Someone Else | LinkedIn message thread | reconnect-style intro | Example reconnect | Sent | Example send already logged. |
`);
  const good = validatePacket(goodPacket, goodDossiers, {
    drafts: goodDrafts,
    liveSentKeys: new Set(
      goodLog
        .filter(row => /^sent\b/i.test(normalizeText(row.status)))
        .map(row => normalizeKey(row.recipient)),
    ),
  });
  if (good.errors.length) {
    throw new Error(`Self-test good packet unexpectedly failed: ${good.errors.join(' | ')}`);
  }

  const contaminationPacket = parsePacket(`
Status: ready to send

### Julia Kreutzer

Hi Tim - I'm applying to Accenture's AI Transformation & Solutions Lead role. Would love to connect.
`);
  const contamination = validatePacket(contaminationPacket, goodDossiers, {
    drafts: goodDrafts,
    liveSentKeys: new Set(
      goodLog
        .filter(row => /^sent\b/i.test(normalizeText(row.status)))
        .map(row => normalizeKey(row.recipient)),
    ),
  });
  if (!contamination.errors.some(error => error.includes('greeting targets "Tim"'))) {
    throw new Error('Self-test bad packet did not catch recipient contamination.');
  }

  const duplicateDrafts = parseDraftMirrorContent(`
## Julia Kreutzer

**To:** Julia Kreutzer <julia@example.com>

**Status:** Sent 2026-07-05

**Subject:** Example reconnect

\`\`\`text
Hi Julia - I saw your work at Cohere Labs and MILA. I'm building Homecastr's forecasting and evaluation stack, and I'd love to stay in touch if that overlap feels interesting.
\`\`\`
`);
  const duplicateLog = parseMarkdownTableContent(`
| Channel | Recipient | Destination | Template | Subject / Context | Status | Notes |
|---|---|---|---|---|---|---|
| Email | Julia Kreutzer | LinkedIn message thread | reconnect-style intro | Example reconnect | Sent | Example send already logged. |
`);
  const duplicatePacket = parsePacket(`
Status: ready to send

### Julia Kreutzer

Hi Julia - I saw your work at Cohere Labs and MILA. I'm building Homecastr's forecasting and evaluation stack, and I'd love to stay in touch if that overlap feels interesting.
`);
  const duplicate = validatePacket(duplicatePacket, goodDossiers, {
    drafts: duplicateDrafts,
    liveSentKeys: new Set(
      duplicateLog
        .filter(row => /^sent\b/i.test(normalizeText(row.status)))
        .map(row => normalizeKey(row.recipient)),
    ),
  });
  if (!duplicate.errors.some(error => error.includes('duplicate send detected'))) {
    throw new Error('Self-test duplicate packet did not catch a stale resend.');
  }

  const establishedDossiers = parseDossiers(`
contact: Julia Kreutzer
organization: Cohere Labs
channel: LinkedIn DM
lane: candidate-seeking
relationship: existing warm thread
relationship_status: established
why_now: A current source-backed reason.
hook: Specific current work.
proof_point: Matching proof.
ask: One small ask.
status: ready to send
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07
`);
  const established = validatePacket(goodPacket, establishedDossiers, {
    drafts: goodDrafts,
    liveSentKeys: new Set(),
    registryRows: [],
    approvalRows: [],
    now: new Date('2026-07-16T12:00:00Z'),
  });
  if (!established.errors.some(error => error.includes('approval_id'))) {
    throw new Error('Self-test established relationship did not require exact current-chat approval.');
  }

  console.log('outreach-preflight self-test passed');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    runSelfTest();
    return;
  }

  const packetPath = resolvePath(args.packet);
  const dossierPath = resolvePath(args.dossier);
  const draftsPath = resolvePath(args.drafts);
  const logPath = resolvePath(args.log);

  if (!existsSync(packetPath)) {
    console.error(`Packet not found: ${args.packet}`);
    process.exit(1);
  }
  if (!existsSync(dossierPath)) {
    console.error(`Dossier not found: ${args.dossier}`);
    process.exit(1);
  }
  if (!existsSync(draftsPath)) {
    console.error(`Draft mirror not found: ${args.drafts}. Fail closed until outreach state is restored.`);
    process.exit(1);
  }
  if (!existsSync(logPath)) {
    console.error(`Outreach log not found: ${args.log}. Fail closed until outreach state is restored.`);
    process.exit(1);
  }

  const packet = parsePacket(readFileSync(packetPath, 'utf8'));
  const dossiers = parseDossiers(readFileSync(dossierPath, 'utf8'));
  const drafts = parseDraftMirror(draftsPath);
  const liveLogRows = parseMarkdownTable(logPath);
  const liveSentKeys = new Set(
    liveLogRows
      .filter(row => /^sent\b/i.test(normalizeText(row.status)))
        .map(row => normalizeKey(row.recipient)),
  );
  const result = validatePacket(packet, dossiers, { drafts, liveSentKeys, liveLogRows }, args.packet);

  if (!result.errors.length && !result.warnings.length) {
    console.log(`PASS ${args.packet}`);
    process.exit(0);
  }

  if (result.errors.length) {
    console.log(`FAIL ${args.packet}`);
    for (const error of result.errors) console.log(`ERROR: ${error}`);
    for (const warning of result.warnings) console.log(`WARN: ${warning}`);
    process.exit(1);
  }

  console.log(`WARN ${args.packet}`);
  for (const warning of result.warnings) console.log(`WARN: ${warning}`);
}

main();
