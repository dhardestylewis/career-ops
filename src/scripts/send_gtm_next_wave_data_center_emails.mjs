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

const messages = [
  {
    key: 'stream-data-centers',
    company: 'Stream Data Centers',
    to: 'info@stream-dc.com',
    confidence: 'official general inquiries route',
    subject: 'Data center location strategy and market risk',
    body: `Hi Stream team,

Your work around location strategy, site development, build-to-suit facilities, and AI-ready capacity stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where this kind of forecasting could support data center site, portfolio, or development-risk decisions.

Would a short compare-notes call be useful, or is there someone on the commercial or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'edgecore',
    company: 'EdgeCore',
    to: 'capacity@edgecore.com',
    confidence: 'official capacity route',
    subject: 'High-density data centers and location risk',
    body: `Hi EdgeCore team,

Your focus on high-density data center capacity, land, power, and community support stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support site, portfolio, or development-risk decisions for AI-scale infrastructure.

Would a short compare-notes call be useful, or is there someone on the capacity or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'aligned-data-centers',
    company: 'Aligned Data Centers',
    to: 'sales@aligneddc.com',
    confidence: 'official sales route',
    subject: 'Adaptive data centers and location risk',
    body: `Hi Aligned team,

Your adaptive data center model and focus on scaling infrastructure faster stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support market selection, land, power, or portfolio-risk decisions.

Would a short compare-notes call be useful, or is there someone on the sales, real estate, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'qts',
    company: 'QTS',
    to: 'sales@q.com',
    confidence: 'official sales route',
    subject: 'AI data centers, communities, and location risk',
    body: `Hi QTS team,

QTS's work across North America and Europe, plus the emphasis on responsible development and community impact, stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support data center site, portfolio, or community-risk decisions.

Would a short compare-notes call be useful, or is there someone on the commercial or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'digital-realty',
    company: 'Digital Realty',
    to: 'sales@digitalrealty.com',
    confidence: 'official sales route',
    subject: 'Data center platform strategy and location risk',
    body: `Hi Digital Realty team,

Digital Realty's global data center platform and work across connected data communities stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support market, site, and portfolio decisions as AI and cloud workloads keep reshaping capacity needs.

Would a short compare-notes call be useful, or is there someone on the sales, platform, or real estate side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'flexential',
    company: 'Flexential',
    to: 'sales@flexential.com',
    confidence: 'official sales route',
    subject: 'High-density capacity and location risk',
    body: `Hi Flexential team,

Your writing on data center site selection, high-density capacity, and AI-era scalability stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market selection, facility planning, or portfolio-risk decisions.

Would a short compare-notes call be useful, or is there someone on the sales or data-center strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'coresite',
    company: 'CoreSite',
    to: 'sales@coresite.com',
    confidence: 'official sales route',
    subject: 'Interconnected data centers and location risk',
    body: `Hi CoreSite team,

CoreSite's interconnected data center campuses and hybrid IT infrastructure focus stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market, site, or portfolio decisions for high-performance infrastructure.

Would a short compare-notes call be useful, or is there someone on the sales or data-center strategy side you would point me toward?

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
  console.log(`Sending next-wave GTM outreach emails from ${profile.data.emailAddress}`);

  for (const message of messages) {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodeMessage(message),
      },
    });

    console.log(`${message.key}\t${message.company}\t${message.to}\t${res.data.id}\t${message.confidence}`);
  }
})();
