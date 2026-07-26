import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadGmailService } from './gmail-auth.mjs';

function parseArgs(argv) {
  const options = { days: 30, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--days') options.days = Number(argv[++index]);
    else if (value === '--json') options.json = true;
    else if (value === '--help' || value === '-h') options.help = true;
  }
  return options;
}

function usage() {
  console.log(`Usage:
  npm run mail:interactions -- --days 30 --json

Imports Gmail message metadata and provider receipts into the shared private
interaction ledger. Message bodies remain in Gmail.
`);
}

function clean(value) {
  return String(value || '').replace(/[\t\r\n]+/g, ' ').trim();
}

function readHeader(headers, name) {
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function inferLane(subject, snippet) {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (/homecastr|properlytic/.test(text)) return 'homecastr-email';
  if (/interview|application|candidate|recruit|hiring|position|role/.test(text)) return 'candidate-email';
  return 'external-email';
}

function writeRegister(rows, path) {
  const headers = [
    'source_system', 'source_account', 'source_id', 'source_parent_id', 'kind', 'channel',
    'lane', 'direction', 'audience', 'title', 'occurred_at', 'status', 'capture_policy',
    'consent_status', 'capture_method', 'capture_provider', 'capture_account',
    'fallback_note_owner', 'evidence_level', 'provider_message_id', 'provider_thread_id',
    'observed_at', 'notes',
  ];
  const lines = [headers.join('\t')];
  for (const row of rows) {
    lines.push(headers.map((header) => clean(row[header])).join('\t'));
  }
  writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
}

async function listMessageRefs(gmail, query) {
  const refs = [];
  let pageToken;
  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 500,
      pageToken,
    });
    refs.push(...(response.data.messages || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return refs;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}
if (!Number.isFinite(args.days) || args.days < 1 || args.days > 3650) {
  usage();
  process.exit(2);
}

const { gmail, source } = loadGmailService();
const profile = await gmail.users.getProfile({ userId: 'me' });
const account = clean(profile.data.emailAddress).toLowerCase();
const query = `in:anywhere newer_than:${Math.floor(args.days)}d`;
const refs = await listMessageRefs(gmail, query);
const observedAt = new Date().toISOString();
const rows = [];

for (let offset = 0; offset < refs.length; offset += 20) {
  const batch = refs.slice(offset, offset + 20);
  const responses = await Promise.all(batch.map((ref) => gmail.users.messages.get({
    userId: 'me',
    id: ref.id,
    format: 'metadata',
    metadataHeaders: ['From', 'To', 'Cc', 'Subject', 'Date', 'Message-ID'],
  })));
  for (let index = 0; index < responses.length; index += 1) {
    const ref = batch[index];
    const message = responses[index].data;
    const headers = message.payload?.headers || [];
    const from = readHeader(headers, 'From');
    const subject = readHeader(headers, 'Subject') || '(no subject)';
    const direction = from.toLowerCase().includes(account) ? 'outbound' : 'inbound';
    const occurredAt = message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : observedAt;
    rows.push({
      source_system: 'gmail',
      source_account: account,
      source_id: message.id,
      source_parent_id: message.threadId || ref.threadId || '',
      kind: 'message',
      channel: 'email',
      lane: inferLane(subject, message.snippet || ''),
      direction,
      audience: 'external',
      title: subject,
      occurred_at: occurredAt,
      status: direction === 'outbound' ? 'sent' : 'received',
      capture_policy: 'required',
      consent_status: 'not_required',
      capture_method: 'provider_receipt',
      capture_provider: 'gmail',
      capture_account: account,
      fallback_note_owner: 'mailbox owner',
      evidence_level: 'occurrence',
      provider_message_id: message.id,
      provider_thread_id: message.threadId || ref.threadId || '',
      observed_at: observedAt,
      notes: 'Gmail metadata and provider receipt imported. Message body remains in Gmail.',
    });
  }
}

let importResult = { rows_seen: 0, rows_written: 0 };
if (rows.length > 0) {
  const scratchRoot = mkdtempSync(join(tmpdir(), 'homecastr-gmail-interactions-'));
  const registerPath = join(scratchRoot, 'gmail-register.tsv');
  try {
    writeRegister(rows, registerPath);
    const output = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-File',
        'C:\\Users\\dhl\\.codex\\bin\\homecastr-interactions.ps1',
        'import-register',
        '--path',
        registerPath,
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    importResult = JSON.parse(output);
  } finally {
    rmSync(scratchRoot, { recursive: true, force: true });
  }
}

const result = {
  authSource: source,
  account,
  query,
  messagesFound: refs.length,
  ledgerRowsWritten: importResult.rows_written || 0,
  interactionReceipt: importResult.receipt || '',
};

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Gmail source: ${result.authSource}`);
  console.log(`Account: ${result.account}`);
  console.log(`Messages imported: ${result.ledgerRowsWritten}`);
  if (result.interactionReceipt) console.log(`Receipt: ${result.interactionReceipt}`);
}
