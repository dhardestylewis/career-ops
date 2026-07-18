import { google } from 'googleapis';
import { loadGmailClient } from './gmail-auth.mjs';

function parseArgs(argv) {
  const options = {
    calendarIds: [],
    json: false,
    timeZone: 'America/New_York',
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];

    if (value === '--json') {
      options.json = true;
      continue;
    }

    if (value === '--calendar' || value === '-c') {
      options.calendarIds.push(argv[i + 1]);
      i += 1;
      continue;
    }

    if (value === '--time-min') {
      options.timeMin = argv[i + 1];
      i += 1;
      continue;
    }

    if (value === '--time-max') {
      options.timeMax = argv[i + 1];
      i += 1;
      continue;
    }

    if (value === '--timezone' || value === '--time-zone') {
      options.timeZone = argv[i + 1];
      i += 1;
      continue;
    }

    if (value === '--help' || value === '-h') {
      options.help = true;
      continue;
    }

    options.positional.push(value);
  }

  if (!options.timeMin && options.positional[0]) {
    options.timeMin = options.positional[0];
  }
  if (!options.timeMax && options.positional[1]) {
    options.timeMax = options.positional[1];
  }
  if (options.calendarIds.length === 0) {
    options.calendarIds.push('primary');
  }

  return options;
}

function printUsage() {
  console.log(`Usage:
  npm run calendar:freebusy -- --time-min 2026-07-22T11:30:00-04:00 --time-max 2026-07-22T12:00:00-04:00
  npm run calendar:freebusy -- --calendar primary --time-min 2026-07-22T11:30:00-04:00 --time-max 2026-07-22T12:00:00-04:00 --json
`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.timeMin || !args.timeMax) {
  printUsage();
  process.exitCode = args.help ? 0 : 2;
} else {
  try {
    const client = loadGmailClient();
    const calendar = google.calendar({ version: 'v3', auth: client.auth });
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: args.timeMin,
        timeMax: args.timeMax,
        timeZone: args.timeZone,
        items: args.calendarIds.map((id) => ({ id })),
      },
    });

    const calendars = response.data.calendars || {};
    const results = Object.entries(calendars).map(([id, value]) => ({
      id,
      busy: value.busy || [],
      errors: value.errors || [],
    }));
    const isFree = results.every((item) => item.errors.length === 0 && item.busy.length === 0);
    const payload = {
      source: client.source,
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      timeZone: args.timeZone,
      isFree,
      calendars: results,
    };

    if (args.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`Source: ${payload.source}`);
      console.log(`Window: ${payload.timeMin} to ${payload.timeMax} (${payload.timeZone})`);
      console.log(`Live calendar result: ${payload.isFree ? 'free' : 'busy or unavailable'}`);
      for (const item of payload.calendars) {
        console.log(`${item.id}: ${item.busy.length} busy block(s), ${item.errors.length} error(s)`);
        for (const busy of item.busy) {
          console.log(`  busy ${busy.start} to ${busy.end}`);
        }
        for (const error of item.errors) {
          console.log(`  error ${error.reason || error.domain || JSON.stringify(error)}`);
        }
      }
    }
  } catch (error) {
    const details = JSON.stringify(error.errors || error.response?.data || {});
    if (error.code === 403 && /insufficient|scope|permission/i.test(`${error.message} ${details}`)) {
      console.error('Calendar free/busy access is not authorized for the current token.');
      console.error('Run node src/scripts/auth_gmail.mjs --force to grant calendar.freebusy scope.');
      process.exit(3);
    } else {
      console.error(error.message || error);
      process.exit(1);
    }
  }
}
