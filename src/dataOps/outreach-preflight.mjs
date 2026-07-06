#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_PACKET = 'data/outreach/terra-ai-send-packet.md';
const DEFAULT_DOSSIER = 'data/outreach/contact-dossier.md';

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

function parseArgs(argv) {
  const args = { packet: DEFAULT_PACKET, dossier: DEFAULT_DOSSIER, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--packet') args.packet = argv[++i];
    else if (arg === '--dossier') args.dossier = argv[++i];
    else if (arg === '--self-test') args.selfTest = true;
  }
  return args;
}

function resolvePath(pathLike) {
  return join(ROOT, pathLike);
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
      whyNow: pick('why_now'),
      hook: pick('hook'),
      proofPoint: pick('proof_point'),
      ask: pick('ask'),
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

function validatePacket(packet, dossiers) {
  const errors = [];
  const warnings = [];

  if (!packet.messages.length) {
    errors.push('No `### Recipient` message blocks found in the send packet.');
    return { errors, warnings };
  }

  if (/\b(held|blocked|research)\b/i.test(packet.status)) {
    errors.push(`Packet status is not sendable: "${packet.status || 'missing'}".`);
  }

  const firstNames = unique(packet.messages.map(message => normalizeKey(message.firstName)));
  const normalizedBodies = new Map();

  for (const message of packet.messages) {
    const body = message.body;
    if (!body) {
      errors.push(`${message.heading}: message body is empty.`);
      continue;
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

    const dossier = dossiers.find(entry => entry.key === message.headingKey);
    if (!dossier) {
      warnings.push(`${message.heading}: no exact contact dossier found.`);
      continue;
    }

    if (!/\bready\b/i.test(dossier.status)) {
      errors.push(`${message.heading}: dossier status is "${dossier.status || 'missing'}", not ready.`);
    }

    for (const [field, value] of [
      ['why_now', dossier.whyNow],
      ['hook', dossier.hook],
      ['proof_point', dossier.proofPoint],
      ['ask', dossier.ask],
    ]) {
      if (!value) errors.push(`${message.heading}: dossier is missing ${field}.`);
    }

    if (isWorkPitch(body)) {
      if (!dossier.spcAffiliation) errors.push(`${message.heading}: SPC affiliation check is missing.`);
      if (!dossier.spcCheckedAt) errors.push(`${message.heading}: SPC checked date is missing.`);
      if (/\b(yes|member|affiliate|affiliated|unclear|unknown|blocked)\b/i.test(dossier.spcAffiliation)) {
        errors.push(`${message.heading}: SPC status "${dossier.spcAffiliation}" blocks a work pitch.`);
      }
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
why_now: A live Beginners journey session creates a concrete reason to reconnect.
hook: Her current Cohere Labs and MILA research path is the specific bridge.
proof_point: Homecastr forecasting and evaluation work is the supporting proof point.
ask: Stay in touch and compare notes briefly.
status: ready to send
spc_affiliation: not-affiliated
spc_checked_at: 2026-07-05
`);
  const good = validatePacket(goodPacket, goodDossiers);
  if (good.errors.length) {
    throw new Error(`Self-test good packet unexpectedly failed: ${good.errors.join(' | ')}`);
  }

  const badPacket = parsePacket(`
Status: ready to send

### Julia Kreutzer

Hi Tim - I'm applying to Accenture's AI Transformation & Solutions Lead role. Would love to connect.
`);
  const badDossiers = goodDossiers;
  const bad = validatePacket(badPacket, badDossiers);
  if (!bad.errors.some(error => error.includes('greeting targets "Tim"'))) {
    throw new Error('Self-test bad packet did not catch recipient contamination.');
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

  if (!existsSync(packetPath)) {
    console.error(`Packet not found: ${args.packet}`);
    process.exit(1);
  }
  if (!existsSync(dossierPath)) {
    console.error(`Dossier not found: ${args.dossier}`);
    process.exit(1);
  }

  const packet = parsePacket(readFileSync(packetPath, 'utf8'));
  const dossiers = parseDossiers(readFileSync(dossierPath, 'utf8'));
  const result = validatePacket(packet, dossiers);

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
