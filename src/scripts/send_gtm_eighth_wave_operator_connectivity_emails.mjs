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
    key: 'switch',
    company: 'Switch',
    to: 'sales@switch.com',
    confidence: 'public sales route in official Switch materials',
    subject: 'AI factories, density, and location risk',
    body: `Hi Switch team,

Switch's AI Factory work stood out because extreme density changes the economics of power, cooling, land, and regional market selection.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support market selection, community-readiness screening, or infrastructure-risk analysis for high-density AI capacity.

Would a short conversation be useful, or is there someone on the sales, strategy, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'skybox-datacenters',
    company: 'Skybox Datacenters',
    to: 'info@skyboxdatacenters.com',
    confidence: 'official Skybox general support and pricing route',
    subject: 'PowerCampus, powered shells, and location risk',
    body: `Hi Skybox team,

Skybox's PowerCampus and powered-shell work stood out, especially the focus on large-scale power delivery and faster hyperscale timelines.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for site selection, power-aware market screening, entitlement/community risk, or regional prioritization.

Would a short conversation be useful, or is there someone on the development, sales, or energy strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'yondr',
    company: 'Yondr Group',
    to: 'info@yondrgroup.com',
    confidence: 'official Yondr contact route',
    subject: 'Hyperscale campuses and location-risk forecasting',
    body: `Hi Yondr team,

Yondr's global hyperscale campus work stood out, particularly where speed-to-market, power readiness, and local market context shape delivery.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for site selection, community-readiness, market prioritization, or development-risk screening.

Would a short conversation be useful, or is there someone on the Americas development or commercial side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cologix',
    company: 'Cologix',
    to: 'sales@cologix.com',
    confidence: 'official Cologix sales route',
    subject: 'Interconnection markets and location risk',
    body: `Hi Cologix team,

Cologix's mix of hyperscale edge capacity, interconnection, and North American market coverage stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for market selection, interconnection-driven demand, expansion risk, or location signals for edge and AI-era capacity.

Would a short conversation be useful, or is there someone on the sales, product, or market strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'netrality',
    company: 'Netrality Data Centers',
    to: 'sales@netrality.com',
    confidence: 'official Netrality sales route',
    subject: 'Interconnection hubs and location risk',
    body: `Hi Netrality team,

Netrality's owner-operated interconnection hubs and powered-shell/wholesale data-center environments stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for location strategy, demand signals, urban infrastructure risk, or expansion-market prioritization.

Would a short conversation be useful, or is there someone on the sales, real estate, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: '365-data-centers',
    company: '365 Data Centers',
    to: 'sales@365datacenters.com',
    confidence: 'public sales route on official data-center location page',
    subject: 'Regional data centers and location-risk forecasting',
    body: `Hi 365 Data Centers team,

365's regional data-center footprint and enterprise infrastructure platform stood out, especially as AI and edge workloads keep changing where capacity is needed.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for market prioritization, regional expansion, facility-risk screening, or demand signals across secondary markets.

Would a short conversation be useful, or is there someone on the sales or market strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'tierpoint',
    company: 'TierPoint',
    to: 'sales@tierpoint.com',
    confidence: 'public sales route in TierPoint data-center materials',
    subject: 'Hybrid infrastructure markets and location risk',
    body: `Hi TierPoint team,

TierPoint's national data-center and hybrid infrastructure footprint stood out, especially across regional markets where proximity, resilience, and capacity constraints matter.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for regional market prioritization, data-center site risk, customer-demand signals, or expansion planning.

Would a short conversation be useful, or is there someone on the data-center, sales, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'colt-dcs',
    company: 'Colt Data Centre Services',
    to: 'dcsinfo@colt.net',
    confidence: 'official Colt DCS information route',
    subject: 'Hyperscale data centers and location risk',
    body: `Hi Colt DCS team,

Colt DCS's hyperscale data-center work stood out, especially given the importance of site strategy, energy availability, and repeatable delivery across global markets.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for site screening, market prioritization, development risk, or power-aware location decisions.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'dartpoints',
    company: 'DartPoints',
    to: 'Info@dartpoints.com',
    confidence: 'official DartPoints information route',
    subject: 'Regional edge data centers and location risk',
    body: `Hi DartPoints team,

DartPoints' regional data-center and edge infrastructure work stood out because demand is increasingly moving beyond the obvious hyperscale hubs.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for regional demand signals, market prioritization, facility-risk screening, or where edge capacity is likely to matter next.

Would a short conversation be useful, or is there someone on the sales or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'global-switch',
    company: 'Global Switch',
    to: 'info@globalswitch.com',
    confidence: 'official Global Switch contact route',
    subject: 'Global interconnection hubs and location risk',
    body: `Hi Global Switch team,

Global Switch's portfolio of high-connectivity urban data-center hubs stood out, especially as AI and cloud demand make power, density, and location strategy more complex.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for market selection, urban infrastructure risk, capacity planning, or site-readiness signals.

Would a short conversation be useful, or is there someone on the commercial or strategy side you would point me toward?

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
  console.log(`Sending eighth-wave operator/connectivity GTM outreach emails from ${profile.data.emailAddress}`);

  for (const message of messages) {
    const rawMessage = encodeMessage(message);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`${message.key}\t${message.company}\t${message.to}\t${res.data.id}\t${message.confidence}`);
  }
})();
