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
    key: 'nextdc',
    company: 'NEXTDC',
    to: 'sales@nextdc.com',
    confidence: 'official NEXTDC sales route',
    subject: 'Australian AI infrastructure and location-risk forecasting',
    body: `Hi NEXTDC team,

NEXTDC's Australian data-centre platform stood out because AI infrastructure, sovereign cloud, power availability, and regional connectivity are making location strategy more important than ever.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Australian market signals, AI campus site risk, power-aware demand forecasting, or location intelligence for data-centre growth.

Would a short conversation be useful, or is there someone on the sales, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'airtrunk',
    company: 'AirTrunk',
    to: 'info@airtrunk.com',
    confidence: 'official AirTrunk enquiries/customer route',
    subject: 'APAC hyperscale data centres and site-selection risk',
    body: `Hi AirTrunk team,

AirTrunk's APAC and Middle East hyperscale platform stood out because power, water, grid timing, land, and community context all shape where cloud and AI capacity can scale.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around hyperscale site screening, regional demand signals, power-aware location risk, or market prioritization for AI-ready campuses.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'princeton-digital-group',
    company: 'Princeton Digital Group',
    to: 'info@princetondg.com',
    confidence: 'public PDG reporting and PeeringDB sales route',
    subject: 'Asian hyperscale and AI-ready data-centre market signals',
    body: `Hi PDG team,

Princeton Digital Group's Asia data-centre platform stood out because cloud and AI growth across India, Indonesia, Japan, Malaysia, Singapore, and South Korea makes market selection increasingly probabilistic.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, power-aware site screening, location risk, or data-centre market prioritization.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'st-telemedia-gdc',
    company: 'ST Telemedia Global Data Centres',
    to: 'info@sttelemediagdc.com',
    confidence: 'official STT GDC publications and facility sales route',
    subject: 'Global/Asian data-centre platform and power-aware market screening',
    body: `Hi STT GDC team,

ST Telemedia Global Data Centres stood out because your multi-region platform sits directly at the intersection of AI demand, power availability, sustainability, and market-by-market infrastructure constraints.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-centre market signals, power-aware location screening, regional risk, or expansion-prioritization inputs.

Would a short conversation be useful, or is there someone on the commercial, revenue, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'nxtra',
    company: 'Nxtra by Airtel',
    to: 'business@nxtra.in',
    confidence: 'official Nxtra business route',
    subject: 'India data-centre growth, AI-ready design, and location risk',
    body: `Hi Nxtra team,

Nxtra's India data-centre footprint and AI-ready infrastructure work stood out because India is scaling quickly across cloud, enterprise, and edge demand while power, sustainability, and local market context stay central.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around India data-centre market signals, site-screening risk, AI-ready capacity planning, or expansion-market forecasting.

Would a short conversation be useful, or is there someone on the business, strategy, or data-centre development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'yotta',
    company: 'Yotta Data Services',
    to: 'info@yotta.com',
    confidence: 'official Yotta general enquiries route',
    subject: 'Sovereign cloud, AI infrastructure, and Indian data-centre markets',
    body: `Hi Yotta team,

Yotta's sovereign cloud, data-centre, and AI infrastructure work stood out because India's digital infrastructure market is scaling fast and depends on a careful read of location, power, regulation, and demand signals.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around India market signals, AI infrastructure location risk, data-centre site screening, or regional expansion forecasting.

Would a short conversation be useful, or is there someone on the cloud, data-centre, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'sify',
    company: 'Sify Technologies',
    to: 'online.sales@sifycorp.com',
    confidence: 'official Sify colocation services sales route',
    subject: 'Indian colocation and cloud data-centre demand signals',
    body: `Hi Sify team,

Sify's colocation, cloud, and data-centre services stood out because India's enterprise infrastructure growth is becoming more location-sensitive across power, compliance, connectivity, and regional demand.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-centre market signals, regional demand forecasting, site risk, or cloud and colocation location strategy.

Would a short conversation be useful, or is there someone on the sales, data-centre, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'ctrls',
    company: 'CtrlS Datacenters',
    to: 'marketing@ctrls.in',
    confidence: 'official CtrlS contact route',
    subject: 'Rated-4 data centres, India expansion, and location-risk forecasting',
    body: `Hi CtrlS team,

CtrlS' Rated-4 data-centre platform and India expansion stood out because large-scale digital infrastructure decisions increasingly depend on power, resiliency, sustainability, and market-specific location risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around India data-centre demand signals, site-screening risk, AI infrastructure markets, or expansion prioritization.

Would a short conversation be useful, or is there someone on the sales, strategy, or data-centre development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'bdx-data-centers',
    company: 'BDx Data Centers',
    to: 'sales@bdxworld.com',
    confidence: 'public BDx data-sheet sales route',
    subject: 'Pan-Asian data-centre expansion and AI infrastructure risk',
    body: `Hi BDx team,

BDx's pan-Asian data-centre platform stood out because AI and hyperscale growth across Singapore, Hong Kong, Indonesia, India, and China raises hard questions around power, connectivity, land, and local market risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, power-aware site risk, data-centre market screening, or expansion forecasting.

Would a short conversation be useful, or is there someone on the sales, development, or strategy side you would point me toward?

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
  console.log(`Sending fourteenth-wave APAC/India AI infrastructure GTM outreach emails from ${profile.data.emailAddress}`);

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
