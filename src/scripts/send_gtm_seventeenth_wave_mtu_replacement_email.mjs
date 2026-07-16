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
  key: 'rolls-royce-mtu-data-center-power',
  bucket: 'Power Infrastructure Vendor',
  company: 'Rolls-Royce mtu Power Systems',
  to: 'info@ps.rolls-royce.com',
  confidence: 'official Rolls-Royce Power Systems / mtu contact route',
  subject: 'Data-center power systems and location-risk forecasting',
  body: `Hi Rolls-Royce mtu team,

mtu's data-center power systems work stood out because AI and hyperscale growth are making backup power, grid constraints, emissions, fuel logistics, and deployment timing central to site decisions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how site and market-risk signals could support data-center power planning, customer screening, or early project prioritization.

Would a short conversation be useful, or is there someone on the data-center power systems side you would point me toward?

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
  console.log(`Sending seventeenth-wave mtu replacement GTM outreach email from ${profile.data.emailAddress}`);

  const rawMessage = encodeMessage(message);
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
    },
  });

  console.log([
    message.key,
    message.bucket,
    message.company,
    message.to,
    res.data.id,
    message.confidence,
  ].join('\t'));
})();
