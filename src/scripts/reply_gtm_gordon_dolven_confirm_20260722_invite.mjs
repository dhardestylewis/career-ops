import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { blockLegacyDirectOutreachSend } from '../core/outreach-send-gate.mjs';

blockLegacyDirectOutreachSend(import.meta.url);

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

const latestMessageId = '19f3a6b7fdc8b8fa';
const threadId = '19f39cff2e4bbedb';
const attendee = {
  name: 'Gordon Dolven',
  email: 'Gordon.Dolven@cbre.com',
};

function header(headers, name) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function encodeSubject(subject) {
  return `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function foldCalendarLine(line) {
  const max = 74;
  if (line.length <= max) return line;
  const chunks = [line.slice(0, max)];
  let rest = line.slice(max);
  while (rest.length > 0) {
    chunks.push(` ${rest.slice(0, max - 1)}`);
    rest = rest.slice(max - 1);
  }
  return chunks.join('\r\n');
}

function escapeCalendarText(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function buildCalendarInvite() {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Homecastr//GTM Outreach//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    'UID:homecastr-cbre-gordon-20260722T153000Z@homecastr.com',
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
    'DTSTART:20260722T153000Z',
    'DTEND:20260722T160000Z',
    `SUMMARY:${escapeCalendarText('Homecastr and CBRE data center market dynamics')}`,
    `DESCRIPTION:${escapeCalendarText('Compare notes on data-center market dynamics, site-selection signals, and forecastable location risk. Bridge/location TBD; happy to use CBRE preferred conferencing if easier.')}`,
    'LOCATION:TBD',
    'ORGANIZER;CN=Daniel Lewis:mailto:daniel@homecastr.com',
    `ATTENDEE;CN=${attendee.name};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${attendee.email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.map(foldCalendarLine).join('\r\n')}\r\n`;
}

function buildReply({ subject, inReplyTo, references }) {
  const boundary = `homecastr_${Date.now()}`;
  const calendar = buildCalendarInvite();
  const body = `Hi Gordon,

Yes, Wednesday, July 22 works. I sent a calendar hold for 11:30am-12:00pm ET.

I left the bridge/location as TBD; happy to use your preferred conferencing if easier.

Looking forward to comparing notes.

Best,
Daniel`;

  const headers = [
    `To: ${attendee.name} <${attendee.email}>`,
    'From: Daniel Lewis <daniel@homecastr.com>',
    `Subject: ${encodeSubject(subject.startsWith('Re:') ? subject : `Re: ${subject}`)}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
    references ? `References: ${references} ${inReplyTo}`.trim() : inReplyTo ? `References: ${inReplyTo}` : null,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean);

  return [
    headers.join('\r\n'),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: text/calendar; charset=utf-8; method=REQUEST; name="homecastr-cbre-data-center-market-dynamics.ics"',
    'Content-Transfer-Encoding: 8bit',
    'Content-Disposition: attachment; filename="homecastr-cbre-data-center-market-dynamics.ics"',
    '',
    calendar,
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

(async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const latest = await gmail.users.messages.get({
    userId: 'me',
    id: latestMessageId,
    format: 'metadata',
    metadataHeaders: ['Subject', 'Message-ID', 'References'],
  });

  const headers = latest.data.payload.headers;
  const subject = header(headers, 'Subject');
  const inReplyTo = header(headers, 'Message-ID');
  const references = header(headers, 'References');
  const raw = base64Url(buildReply({ subject, inReplyTo, references }));

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
      threadId,
    },
  });

  console.log(`reply_invite\t${attendee.email}\t${threadId}\t${res.data.id}\t2026-07-22T11:30:00-04:00/2026-07-22T12:00:00-04:00`);
})();
