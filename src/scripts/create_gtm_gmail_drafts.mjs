import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

function encodeMessage({ to, subject, body }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const headers = [
    to ? `To: ${to}` : null,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
  ].filter(Boolean);

  return Buffer.from(`${headers.join('\n')}\n\n${body}`)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const drafts = [
  {
    key: 'the-data-center-brokers',
    subject: 'Data center site selection and location risk',
    body: `Hi [Name],

Your data center advisory work around site selection, provider selection, and portfolio strategy stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how operators and owners are thinking about power, capacity, and location decisions right now.

Would a short compare-notes call be useful, or is there someone owner-side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cbre-data-center-solutions',
    subject: 'AI data centers, power constraints, and location risk',
    body: `Hi [Name],

CBRE's data-center work on AI demand, power constraints, and portfolio decisions feels directly relevant to what I'm building.

Homecastr is a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought it might be useful to compare notes on how buyers, operators, and capital partners are making location decisions in a tighter power and supply environment.

Would a short compare-notes call be useful, or is there a better owner inside the data-center practice?

Best,
Daniel`,
  },
  {
    key: 'crusoe',
    subject: 'Crusoe real estate strategy and location risk',
    body: `Hi [Name],

Crusoe's AI data-center expansion makes siting, power, and facilities strategy especially interesting right now.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. Given Crusoe's real-estate and data-center growth, I thought it might be useful to compare notes on where this kind of forecasting could support site, portfolio, or development-risk decisions.

Would a short conversation be useful?

Best,
Daniel`,
  },
];

(async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log(`Creating GTM outreach drafts in ${profile.data.emailAddress}`);

  for (const draft of drafts) {
    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodeMessage(draft),
        },
      },
    });

    console.log(`${draft.key}\t${res.data.id}\t${res.data.message?.id || ''}`);
  }
})();
