import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { blockLegacyDirectOutreachSend } from '../core/outreach-send-gate.mjs';

blockLegacyDirectOutreachSend(import.meta.url);

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');
const REPLY_TO_MESSAGE_ID = '19f39d5332b96830';

function getHeader(message, name) {
  return message.payload?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function encodeMessage({ to, subject, body, inReplyTo, references }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const headers = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
    references ? `References: ${references}` : null,
  ].filter(Boolean);

  return Buffer.from(`${headers.join('\n')}\n\n${body}`)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

(async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const original = await gmail.users.messages.get({
    userId: 'me',
    id: REPLY_TO_MESSAGE_ID,
    format: 'full',
  });

  const originalMessage = original.data;
  const originalSubject = getHeader(originalMessage, 'Subject');
  const originalMessageId = getHeader(originalMessage, 'Message-ID');
  const originalReferences = getHeader(originalMessage, 'References');
  const subject = originalSubject.toLowerCase().startsWith('re:') ? originalSubject : `Re: ${originalSubject}`;
  const references = [originalReferences, originalMessageId].filter(Boolean).join(' ');

  const body = `Hi Gordon,

Great, thank you - happy to compare notes.

A few options that should work on my end for 7/20-7/24:

- Monday 7/20 at 1:00pm ET / 11:00am MT
- Tuesday 7/21 at 3:00pm ET / 1:00pm MT
- Thursday 7/23 at 12:30pm ET / 10:30am MT
- Friday 7/24 at 2:00pm ET / 12:00pm MT

If one of those works for you, I can send over a calendar hold.

Best,
Daniel`;

  const rawMessage = encodeMessage({
    to: 'Gordon.Dolven@cbre.com',
    subject,
    body,
    inReplyTo: originalMessageId,
    references,
  });

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
      threadId: originalMessage.threadId,
    },
  });

  console.log(`gordon-dolven-availability-reply\t${res.data.id}\tthread:${originalMessage.threadId}`);
})();
