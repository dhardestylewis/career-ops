import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { google } from 'googleapis';
import { loadGmailClient } from './gmail-auth.mjs';

function parseArgs(argv) {
  const options = { pastDays: 7, futureDays: 30, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--past-days') options.pastDays = Number(argv[++index]);
    else if (value === '--future-days') options.futureDays = Number(argv[++index]);
    else if (value === '--json') options.json = true;
    else if (value === '--help' || value === '-h') options.help = true;
  }
  return options;
}

function usage() {
  console.log(`Usage:
  npm run calendar:interactions -- --past-days 7 --future-days 30 --json

Imports external calendar items into the shared private interaction ledger.
Calendar items remain scheduling evidence until separately reconciled.
`);
}

function clean(value) {
  return String(value || '').replace(/[\t\r\n]+/g, ' ').trim();
}

function isoDaysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function isInformationalCalendar(id) {
  return id.includes('#holiday@group.v.calendar.google.com')
    || id.includes('#contacts@group.v.calendar.google.com');
}

function eventTime(value) {
  if (!value) return '';
  if (value.dateTime) return value.dateTime;
  if (value.date) return `${value.date}T00:00:00Z`;
  return '';
}

function isSelfAttendee(attendee, event, calendarId) {
  const email = clean(attendee.email).toLowerCase();
  return attendee.self
    || email === clean(calendarId).toLowerCase()
    || email === clean(event.organizer?.email).toLowerCase() && event.organizer?.self;
}

function externalAttendees(event, calendarId) {
  return (event.attendees || []).filter((attendee) => (
    attendee.email
    && !attendee.resource
    && !isSelfAttendee(attendee, event, calendarId)
  ));
}

function inferChannel(event) {
  const text = `${event.hangoutLink || ''} ${event.location || ''} ${event.description || ''}`.toLowerCase();
  if (/meet\.google\.com|zoom\.us|teams\.microsoft\.com|webex\.com/.test(text)) return 'video';
  if (/tel:|phone|call/.test(text)) return 'phone';
  return 'calendar';
}

function inferCaptureProvider(event) {
  const text = `${event.hangoutLink || ''} ${event.location || ''} ${event.description || ''}`.toLowerCase();
  if (/meet\.google\.com/.test(text)) return 'google_meet';
  if (/zoom\.us/.test(text)) return 'zoom';
  if (/teams\.microsoft\.com/.test(text)) return 'microsoft_teams';
  if (/webex\.com/.test(text)) return 'webex';
  return '';
}

function inferLane(event) {
  const text = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
  if (/homecastr|properlytic/.test(text)) return 'homecastr-calendar';
  if (/interview|recruit|hiring|candidate/.test(text)) return 'candidate-calendar';
  return 'external-calendar';
}

async function listEvents(calendar, calendarId, timeMin, timeMax) {
  const events = [];
  let pageToken;
  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      showDeleted: true,
      maxResults: 2500,
      pageToken,
    });
    events.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);
  return events;
}

function writeRegister(rows, path) {
  const headers = [
    'source_system', 'source_account', 'source_id', 'source_parent_id', 'kind', 'channel',
    'lane', 'direction', 'audience', 'title', 'scheduled_start', 'scheduled_end', 'status',
    'capture_policy', 'consent_status', 'capture_method', 'capture_provider', 'capture_account',
    'fallback_note_owner', 'evidence_level', 'observed_at', 'notes',
  ];
  const lines = [headers.join('\t')];
  for (const row of rows) {
    lines.push(headers.map((header) => clean(row[header])).join('\t'));
  }
  writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}
if (!Number.isFinite(args.pastDays) || !Number.isFinite(args.futureDays) || args.pastDays < 0 || args.futureDays < 0) {
  usage();
  process.exit(2);
}

const client = loadGmailClient();
const calendar = google.calendar({ version: 'v3', auth: client.auth });
const listResponse = await calendar.calendarList.list({ maxResults: 250, showHidden: false });
const calendars = (listResponse.data.items || []).filter((entry) => (
  (entry.primary || entry.selected) && !isInformationalCalendar(entry.id)
));
const timeMin = isoDaysFromNow(-args.pastDays);
const timeMax = isoDaysFromNow(args.futureDays);
const observedAt = new Date().toISOString();
const rows = [];
const calendarErrors = [];

for (const entry of calendars) {
  let events;
  try {
    events = await listEvents(calendar, entry.id, timeMin, timeMax);
  } catch (error) {
    calendarErrors.push({
      calendarId: entry.id,
      name: entry.summary || entry.id,
      code: error.code || error.status || 'unknown',
      message: error.message || String(error),
    });
    continue;
  }
  for (const event of events) {
    const attendees = externalAttendees(event, entry.id);
    if (attendees.length === 0) continue;
    const channel = inferChannel(event);
    const lane = inferLane(event);
    const provider = inferCaptureProvider(event);
    const capturePolicy = ['homecastr-calendar', 'candidate-calendar'].includes(lane) ? 'required' : 'optional';
    const captureMethod = channel === 'video' && provider ? 'platform_manual' : 'manual_notes';
    rows.push({
      source_system: 'google_calendar',
      source_account: entry.id,
      source_id: event.id,
      source_parent_id: event.recurringEventId || '',
      kind: /interview/i.test(event.summary || '') ? 'interview' : 'meeting',
      channel,
      lane,
      direction: 'bidirectional',
      audience: 'external',
      title: event.summary || '(untitled calendar item)',
      scheduled_start: eventTime(event.start),
      scheduled_end: eventTime(event.end),
      status: event.status === 'cancelled' ? 'canceled' : 'scheduled',
      capture_policy: capturePolicy,
      consent_status: captureMethod === 'manual_notes' ? 'not_required' : 'unknown',
      capture_method: captureMethod,
      capture_provider: provider,
      capture_account: provider === 'google_meet' ? entry.id : '',
      fallback_note_owner: 'Daniel',
      evidence_level: 'scheduled',
      observed_at: observedAt,
      notes: `Calendar sync found ${attendees.length} external attendee(s). Scheduling is not occurrence evidence.`,
    });
  }
}

let importResult = { rows_seen: 0, rows_written: 0 };
if (rows.length > 0) {
  const scratchRoot = mkdtempSync(join(tmpdir(), 'homecastr-calendar-interactions-'));
  const registerPath = join(scratchRoot, 'calendar-register.tsv');
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
  authSource: client.source,
  calendarCount: calendars.length,
  accessibleCalendarCount: calendars.length - calendarErrors.length,
  calendarErrors,
  externalEventCount: rows.length,
  timeMin,
  timeMax,
  ledgerRowsWritten: importResult.rows_written || 0,
  interactionReceipt: importResult.receipt || '',
};

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Calendar source: ${result.authSource}`);
  console.log(`Calendars checked: ${result.calendarCount}`);
  console.log(`Calendars accessible: ${result.accessibleCalendarCount}`);
  console.log(`External items imported: ${result.ledgerRowsWritten}`);
  console.log(`Range: ${result.timeMin} to ${result.timeMax}`);
  if (result.interactionReceipt) console.log(`Receipt: ${result.interactionReceipt}`);
  for (const error of result.calendarErrors) {
    console.log(`Calendar error ${error.calendarId}: ${error.code} ${error.message}`);
  }
}
