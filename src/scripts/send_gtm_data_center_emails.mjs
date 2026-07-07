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

const messages = [
  {
    key: 'ali-greenwood',
    name: 'Ali Greenwood',
    to: 'ali.greenwood@cushwake.com',
    confidence: 'public-source verified',
    subject: 'Data center site selection and location risk',
    body: `Hi Ali,

Your data center advisory work around site selection, provider selection, and portfolio strategy stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how operators and owners are thinking about power, capacity, and location decisions right now.

Would a short compare-notes call be useful, or is there someone owner-side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'bo-bond',
    name: 'Bo Bond',
    to: 'bo.bond@cushwake.com',
    confidence: 'public-source verified',
    subject: 'Data center site selection and location risk',
    body: `Hi Bo,

Your data center advisory work around site selection, provider selection, and portfolio strategy stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how operators and owners are thinking about power, capacity, and location decisions right now.

Would a short compare-notes call be useful, or is there someone owner-side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'pat-lynch',
    name: 'Pat Lynch',
    to: 'pat.lynch@cbre.com',
    confidence: 'public-source verified',
    subject: 'AI data centers, power constraints, and location risk',
    body: `Hi Pat,

CBRE's data-center work on AI demand, power constraints, and portfolio decisions feels directly relevant to what I'm building.

Homecastr is a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought it might be useful to compare notes on how buyers, operators, and capital partners are making location decisions in a tighter power and supply environment.

Would a short compare-notes call be useful, or is there a better owner inside the data-center practice?

Best,
Daniel`,
  },
  {
    key: 'william-nelligan',
    name: 'William Nelligan',
    to: 'william.nelligan@cbre.com',
    confidence: 'corporate-pattern route; official profile exposes email button but not raw address',
    subject: 'AI data centers, power constraints, and location risk',
    body: `Hi William,

CBRE's data-center work on AI demand, power constraints, and portfolio decisions feels directly relevant to what I'm building.

Homecastr is a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought it might be useful to compare notes on how buyers, operators, and capital partners are making location decisions in a tighter power and supply environment.

Would a short compare-notes call be useful, or is there a better owner inside the data-center practice?

Best,
Daniel`,
  },
  {
    key: 'kevin-aussef',
    name: 'Kevin Aussef',
    to: 'kevin.aussef@cbre.com',
    confidence: 'public-source verified',
    subject: 'AI data centers, power constraints, and location risk',
    body: `Hi Kevin,

CBRE's data-center work on AI demand, power constraints, and portfolio decisions feels directly relevant to what I'm building.

Homecastr is a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought it might be useful to compare notes on how buyers, operators, and capital partners are making location decisions in a tighter power and supply environment.

Would a short compare-notes call be useful, or is there a better owner inside the data-center practice?

Best,
Daniel`,
  },
  {
    key: 'matt-field',
    name: 'Matt Field',
    to: 'matt.field@crusoe.ai',
    confidence: 'corporate-pattern route; no raw public email found',
    subject: 'Crusoe real estate strategy and location risk',
    body: `Hi Matt,

Crusoe's AI data-center expansion makes siting, power, and facilities strategy especially interesting right now.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. Given Crusoe's real-estate and data-center growth, I thought it might be useful to compare notes on where this kind of forecasting could support site, portfolio, or development-risk decisions.

Would a short conversation be useful?

Best,
Daniel`,
  },
  {
    key: 'chris-dolan',
    name: 'Chris Dolan',
    to: 'chris.dolan@crusoe.ai',
    confidence: 'corporate-pattern route; no raw public email found',
    subject: 'Crusoe real estate strategy and location risk',
    body: `Hi Chris,

Crusoe's AI data-center expansion makes siting, power, and facilities strategy especially interesting right now.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. Given Crusoe's real-estate and data-center growth, I thought it might be useful to compare notes on where this kind of forecasting could support site, portfolio, or development-risk decisions.

Would a short conversation be useful?

Best,
Daniel`,
  },
  {
    key: 'nader-pakfar',
    name: 'Nader Pakfar',
    to: 'nader.pakfar@crusoe.ai',
    confidence: 'corporate-pattern route; no raw public email found',
    subject: 'Crusoe real estate strategy and location risk',
    body: `Hi Nader,

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
  console.log(`Sending GTM outreach emails from ${profile.data.emailAddress}`);

  for (const message of messages) {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodeMessage(message),
      },
    });

    console.log(`${message.key}\t${message.name}\t${message.to}\t${res.data.id}\t${message.confidence}`);
  }
})();
