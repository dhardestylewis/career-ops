import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { blockLegacyDirectOutreachSend } from '../core/outreach-send-gate.mjs';

blockLegacyDirectOutreachSend(import.meta.url);

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

function encodeMessage({ to, cc, subject, body }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const headers = [
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
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
    key: 'vantage-data-centers',
    company: 'Vantage Data Centers',
    to: 'sales@vantage-dc.com',
    confidence: 'public sales route; official site also publishes contact phone/form',
    subject: 'Hyperscale campuses and location risk',
    body: `Hi Vantage team,

Vantage's hyperscale campuses and focus on delivering capacity at speed stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how this kind of forecasting could support site, market, or development-risk decisions as AI and cloud demand keeps moving capacity planning upstream.

Would a short compare-notes call be useful, or is there someone on the commercial or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'stack-infrastructure',
    company: 'STACK Infrastructure',
    to: 'sales@stackinfra.com',
    confidence: 'public sales route on STACK-hosted info pages',
    subject: 'Powered land, AI capacity, and location risk',
    body: `Hi STACK team,

STACK's focus on powered land, scalable AI/ML density, and global campus delivery stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support market selection, power-aware siting, or portfolio-risk decisions.

Would a short compare-notes call be useful, or is there someone on the sales, real estate, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'databank',
    company: 'DataBank',
    to: 'sales@databank.com',
    confidence: 'public sales route on DataBank materials',
    subject: 'Edge reach, AI infrastructure, and location risk',
    body: `Hi DataBank team,

DataBank's metro footprint, edge reach, and high-density infrastructure work stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market, facility, and portfolio-risk decisions for data center capacity.

Would a short compare-notes call be useful, or is there someone on the sales or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'compass-datacenters',
    company: 'Compass Datacenters',
    to: 'info@compassdatacenters.com',
    confidence: 'public general inquiries route',
    subject: 'Community-first campuses and location risk',
    body: `Hi Compass team,

Compass's community-first campus model and work delivering capacity for cloud and hyperscale customers stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support site, community, and development-risk decisions for data center campuses.

Would a short compare-notes call be useful, or is there someone on the development or commercial side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'datacenterhawk',
    company: 'datacenterHawk',
    to: 'info@datacenterhawk.com',
    confidence: 'public general inquiries route',
    subject: 'Data center market intelligence and forecasting',
    body: `Hi datacenterHawk team,

Your market-intelligence work across supply, demand, pricing, and data center trends stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting, geospatial signal, and data-center market intelligence can complement each other.

Would a short conversation be useful, or is there someone on the product or partnerships side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'wiredre',
    company: 'WiredRE',
    to: 'info@wiredre.com',
    confidence: 'official contact route',
    subject: 'Data center advisory, power-ready land, and location risk',
    body: `Hi WiredRE team,

Your data-center advisory work around site selection, industrial-scale compute, and power-ready land stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support land, power, and market decisions for data-center projects.

Would a short compare-notes call be useful, or is there someone on the advisory or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'lincoln-property-data-centers',
    company: 'Lincoln Property Company Data Centers',
    to: 'rsullivan@lpc.com',
    confidence: 'public data-center leasing/contact route',
    subject: 'Data center site selection and investment risk',
    body: `Hi Ryan,

Lincoln's data center work across acquisitions, investments, site selection, build-to-suit development, leasing, and powered land stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support site, portfolio, or development-risk decisions for mission-critical real estate.

Would a short compare-notes call be useful, or is there someone on the data center team you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'jll-data-centers',
    company: 'JLL Data Centers',
    to: 'matt.landek@jll.com',
    cc: 'carl.beardsley@jll.com',
    confidence: 'official JLL data-center people pages',
    subject: 'Data center services and location risk',
    body: `Hi Matt,

JLL's data-center work across site selection, land acquisition, portfolio strategy, and AI-ready infrastructure stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support data-center site, market, or portfolio decisions as power and capacity constraints keep reshaping the map.

Would a short compare-notes call be useful, or is there someone on the data-center services side you would point me toward?

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
  console.log(`Sending third-wave GTM outreach emails from ${profile.data.emailAddress}`);

  for (const message of messages) {
    const rawMessage = encodeMessage(message);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`${message.key}\t${message.company}\t${message.to}${message.cc ? `; cc=${message.cc}` : ''}\t${res.data.id}\t${message.confidence}`);
  }
})();
