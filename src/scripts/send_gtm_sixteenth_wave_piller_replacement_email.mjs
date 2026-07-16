import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { blockLegacyDirectOutreachSend } from '../core/outreach-send-gate.mjs';

blockLegacyDirectOutreachSend(import.meta.url);

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

function encodeMessage({ to, subject, body }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const headers = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
  ];

  return Buffer.from(`${headers.join('\n')}\n\n${body}`)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const message = {
  key: 'piller-power-systems',
  company: 'Piller Power Systems',
  to: 'info@piller.com',
  confidence: 'official Piller headquarters contact route',
  subject: 'Mission-critical power protection and location-risk forecasting',
  body: `Hi Piller team,

Piller's mission-critical power protection work stood out because AI and high-density data-center projects increasingly need to evaluate power reliability, deployment timing, redundancy, and site-level risk together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk signals could complement mission-critical power planning, data-center site screening, or infrastructure expansion decisions.

Would a short conversation be useful, or is there someone on the data-center, sales, or strategy side you would point me toward?

Best,
Daniel`,
};

(async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log(`Sending sixteenth-wave Piller replacement GTM outreach email from ${profile.data.emailAddress}`);

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodeMessage(message),
    },
  });

  console.log(`${message.key}\t${message.company}\t${message.to}\t${res.data.id}\t${message.confidence}`);
})();
