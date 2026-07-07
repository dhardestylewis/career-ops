import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');
const FROM_ACCOUNT = 'daniel@homecastr.com';

function decodePart(part) {
  if (!part?.body?.data) return '';
  return Buffer.from(part.body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function extractText(payload) {
  if (!payload) return '';
  if (payload.parts?.length) {
    return payload.parts.map(extractText).join('\n');
  }
  return decodePart(payload);
}

function getHeader(message, name) {
  return message.payload?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function isAutoResponse(message) {
  const autoSubmitted = getHeader(message, 'Auto-Submitted').toLowerCase();
  const precedence = getHeader(message, 'Precedence').toLowerCase();
  const from = getHeader(message, 'From').toLowerCase();
  const subject = getHeader(message, 'Subject').toLowerCase();

  return (
    autoSubmitted.includes('auto') ||
    precedence.includes('bulk') ||
    precedence.includes('list') ||
    from.includes('mailer-daemon') ||
    from.includes('postmaster') ||
    subject.includes('undeliver') ||
    subject.includes('delivery status') ||
    subject.includes('out of office') ||
    subject.includes('automatic reply') ||
    subject.includes('auto reply')
  );
}

function threadHasGtmSentMessage(messages) {
  return messages.some((message) => {
    const from = getHeader(message, 'From').toLowerCase();
    if (!from.includes(FROM_ACCOUNT)) return false;

    const subject = getHeader(message, 'Subject').toLowerCase();
    const body = extractText(message.payload).toLowerCase();
    return (
      subject.includes('data-center') ||
      subject.includes('data center') ||
      subject.includes('data-centre') ||
      subject.includes('data centre') ||
      subject.includes('location risk') ||
      body.includes('homecastr') ||
      body.includes('probabilistic real-estate forecasting') ||
      body.includes('compare-notes conversation')
    );
  });
}

function summarizeMessage(message) {
  const body = extractText(message.payload).replace(/\s+/g, ' ').trim();
  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader(message, 'From'),
    to: getHeader(message, 'To'),
    cc: getHeader(message, 'Cc'),
    date: getHeader(message, 'Date'),
    subject: getHeader(message, 'Subject'),
    auto: isAutoResponse(message),
    snippet: message.snippet,
    bodyPreview: body.slice(0, 700),
  };
}

(async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const query = 'in:inbox newer_than:2d -from:daniel@homecastr.com';
  const listed = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 100,
  });

  const candidates = [];
  for (const item of listed.data.messages ?? []) {
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: item.threadId,
      format: 'full',
    });
    const messages = thread.data.messages ?? [];
    if (!threadHasGtmSentMessage(messages)) continue;

    const inboundMessages = messages
      .filter((message) => !getHeader(message, 'From').toLowerCase().includes(FROM_ACCOUNT))
      .map(summarizeMessage);
    candidates.push(...inboundMessages);
  }

  const unique = new Map();
  for (const candidate of candidates) {
    unique.set(candidate.id, candidate);
  }

  const rows = [...unique.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log(JSON.stringify({ query, count: rows.length, rows }, null, 2));
})();
