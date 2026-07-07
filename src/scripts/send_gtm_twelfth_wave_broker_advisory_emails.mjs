import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

function encodeMessage({ to, cc, subject, body }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const headers = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
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

const messages = [
  {
    key: 'cushman-data-center-advisory',
    company: 'Cushman & Wakefield Data Center Advisory Group',
    to: 'rick.hughes@cushwake.com',
    cc: 'alex.smith@cushwake.com, kevin.imboden@cushwake.com, don.rodie@cushwake.com, anne.rosenau@cushwake.com',
    confidence: 'public Cushman & Wakefield data-center market reports',
    subject: 'Data-center advisory, regional market signals, and location-risk forecasting',
    body: `Hi Rick, Alex, Kevin, Don, and Anne,

Your data-center advisory and market work at Cushman stood out because the next wave of AI and cloud demand seems to be making site selection more dependent on power, community context, infrastructure timing, and local market signals.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional data-center signals, power-plus-permission risk, portfolio planning, or how location forecasting could support advisory work.

Would a short conversation be useful, or is there someone else on the data-center advisory side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cbre-data-center-na',
    company: 'CBRE Data Center Solutions North America',
    to: 'molly.sackles@cbre.com',
    cc: 'gordon.dolven@cbre.com, william.hassan@cbre.com, todd.bateman@cbre.com',
    confidence: 'public CBRE data-center reports and property materials',
    subject: 'Data-center research, site selection, and forecastable location risk',
    body: `Hi Molly, Gordon, William, and Todd,

CBRE's data-center research and advisory work stood out because power constraints, site selection, AI demand, and community context are converging into a much more probabilistic location problem.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market signals, site-screening risk, research inputs, or how forecastable location risk could support data-center advisory conversations.

Would a short conversation be useful, or is there someone on the Data Center Solutions side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cbre-data-centre-europe',
    company: 'CBRE Data Centre Solutions Europe',
    to: 'andrew.jay@cbre.com',
    cc: 'kevin.restivo@cbre.com',
    confidence: 'public CBRE data-centre reports',
    subject: 'European data-centre markets and location-risk signals',
    body: `Hi Andrew and Kevin,

CBRE's European data-centre research and advisory work stood out because power availability, grid timing, permitting, land constraints, and AI demand are changing how markets need to be compared.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-centre market signals, location-risk forecasting, power-aware market screening, or where probabilistic real-estate signals could complement advisory and research work.

Would a short conversation be useful, or is there someone on the European data-centre team you would point me toward?

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
  console.log(`Sending twelfth-wave broker/advisory GTM outreach emails from ${profile.data.emailAddress}`);

  for (const message of messages) {
    const rawMessage = encodeMessage(message);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`${message.key}\t${message.company}\t${message.to}\t${message.cc ?? ''}\t${res.data.id}\t${message.confidence}`);
  }
})();
