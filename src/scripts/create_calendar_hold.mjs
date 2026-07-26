import { createHash } from 'node:crypto';
import { google } from 'googleapis';
import { loadGmailClient } from './gmail-auth.mjs';

function parseArgs(argv) {
  const options = {
    calendarId: 'primary',
    timeZone: 'America/New_York',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const next = argv[index + 1];

    if (value === '--summary') options.summary = next;
    else if (value === '--start') options.start = next;
    else if (value === '--end') options.end = next;
    else if (value === '--description') options.description = next;
    else if (value === '--calendar') options.calendarId = next;
    else if (value === '--timezone' || value === '--time-zone') options.timeZone = next;
    else if (value === '--help' || value === '-h') options.help = true;
    else continue;

    if (value !== '--help' && value !== '-h') index += 1;
  }

  return options;
}

function printUsage() {
  console.log(`Usage:
  npm run calendar:hold -- --summary "Hold: MAG discussion" --start 2026-07-28T13:00:00-04:00 --end 2026-07-28T13:30:00-04:00

Creates an idempotent private, blocking, tentative hold with no attendees.
`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.summary || !args.start || !args.end) {
  printUsage();
  process.exitCode = args.help ? 0 : 2;
} else {
  try {
    const client = loadGmailClient();
    const calendar = google.calendar({ version: 'v3', auth: client.auth });
    const holdKey = createHash('sha256')
      .update(`${args.calendarId}|${args.summary}|${args.start}|${args.end}`)
      .digest('hex');
    const existing = await calendar.events.list({
      calendarId: args.calendarId,
      privateExtendedProperty: `codexHoldKey=${holdKey}`,
      showDeleted: false,
      singleEvents: true,
      timeMin: args.start,
      timeMax: args.end,
      maxResults: 10,
    });
    const prior = (existing.data.items || [])[0];

    if (prior) {
      console.log(JSON.stringify({ created: false, id: prior.id, htmlLink: prior.htmlLink }, null, 2));
    } else {
      const response = await calendar.events.insert({
        calendarId: args.calendarId,
        requestBody: {
          summary: args.summary,
          description: args.description || 'Temporary scheduling hold. No attendees invited.',
          start: { dateTime: args.start, timeZone: args.timeZone },
          end: { dateTime: args.end, timeZone: args.timeZone },
          status: 'tentative',
          transparency: 'opaque',
          visibility: 'private',
          reminders: { useDefault: false },
          extendedProperties: {
            private: { codexHoldKey: holdKey },
          },
        },
      });
      console.log(JSON.stringify({ created: true, id: response.data.id, htmlLink: response.data.htmlLink }, null, 2));
    }
  } catch (error) {
    console.error(error.response?.data?.error?.message || error.message || error);
    process.exit(1);
  }
}
