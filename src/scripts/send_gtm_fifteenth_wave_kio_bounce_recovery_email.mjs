import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

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
  key: 'kio-data-centers-retry',
  company: 'KIO Data Centers',
  to: 'contacto@kionetworks.com',
  confidence: 'alternate public KIO corporate contact route after ventas relay failure',
  subject: 'Mexico and LatAm data centers, interconnection, and market risk',
  body: `Hi KIO Data Centers team,

KIO's data-center network across Mexico, Central America, the Caribbean, and Colombia stood out because interconnection, cloud demand, power resilience, and regional growth signals are becoming harder to forecast with static market views.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Mexico and LatAm data-center demand signals, interconnection-aware site risk, AI infrastructure markets, or expansion prioritization.

Would a short conversation be useful, or is there someone on the sales, data-center, or strategy side you would point me toward?

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
  console.log(`Sending KIO fifteenth-wave bounce recovery email from ${profile.data.emailAddress}`);

  const rawMessage = encodeMessage(message);
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
    },
  });

  console.log(`${message.key}\t${message.company}\t${message.to}\t\t${res.data.id}\t${message.confidence}`);
})();
