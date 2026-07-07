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
    key: 'khazna',
    company: 'Khazna Data Centers',
    to: 'sales@khazna.ae',
    confidence: 'official Khazna sales route',
    subject: 'UAE AI-ready data centers and location-risk forecasting',
    body: `Hi Khazna team,

Khazna's UAE data-center platform stood out because AI-ready capacity, power availability, sustainability, and regional connectivity are making location strategy more probabilistic.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around MENA data-center demand signals, power-aware site screening, AI campus location risk, or market prioritization.

Would a short conversation be useful, or is there someone on the sales, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'gulf-data-hub',
    company: 'Gulf Data Hub',
    to: 'support@gulfdatahub.ae',
    confidence: 'official Gulf Data Hub support/contact route',
    subject: 'GCC hyperscale data centers and market-risk signals',
    body: `Hi Gulf Data Hub team,

Gulf Data Hub's Middle East data-center footprint stood out because hyperscale and AI demand across the GCC is increasingly constrained by power, land, connectivity, and local market dynamics.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand forecasting, power-aware site risk, GCC market signals, or expansion-market screening.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'center3',
    company: 'center3',
    to: 'sales@center3.com',
    confidence: 'public center3 sales route from company press materials',
    subject: 'Saudi/MENA data centers, connectivity, and location risk',
    body: `Hi center3 team,

center3's Saudi and MENA digital-infrastructure platform stood out because carrier-neutral data centers, subsea connectivity, and AI demand all depend on a careful read of regional location risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Saudi/MENA data-center demand signals, connectivity-aware site selection, power constraints, or expansion-market forecasting.

Would a short conversation be useful, or is there someone on the sales, data-center, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'scala-data-centers',
    company: 'Scala Data Centers',
    to: 'presales@scaladatacenters.com',
    confidence: 'public PeeringDB facility sales route',
    subject: 'Latin America hyperscale campuses and power-aware site risk',
    body: `Hi Scala team,

Scala's Latin America hyperscale campus strategy stood out because AI and cloud growth in Brazil, Mexico, Chile, and Colombia puts power, permitting, sustainability, and demand timing at the center of location decisions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around LatAm hyperscale market signals, power-aware site screening, AI-ready campus prioritization, or expansion forecasting.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'ascenty',
    company: 'Ascenty',
    to: 'contato@ascenty.com',
    confidence: 'official Ascenty contact route',
    subject: 'Latin America data centers, connectivity, and AI demand signals',
    body: `Hi Ascenty team,

Ascenty's data-center and connectivity platform across Latin America stood out because enterprise, cloud, and AI infrastructure growth increasingly depends on power, fiber, local demand, and market-by-market location risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around LatAm data-center demand signals, connectivity-aware location risk, regional expansion forecasting, or AI infrastructure market screening.

Would a short conversation be useful, or is there someone on the commercial, data-center, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'kio-data-centers',
    company: 'KIO Data Centers',
    to: 'ventas@kionetworks.com',
    confidence: 'public KIO commercial route',
    subject: 'Mexico and LatAm data centers, interconnection, and market risk',
    body: `Hi KIO Data Centers team,

KIO's data-center network across Mexico, Central America, the Caribbean, and Colombia stood out because interconnection, cloud demand, power resilience, and regional growth signals are becoming harder to forecast with static market views.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Mexico and LatAm data-center demand signals, interconnection-aware site risk, AI infrastructure markets, or expansion prioritization.

Would a short conversation be useful, or is there someone on the sales, data-center, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'nabiax',
    company: 'Nabiax',
    to: 'info@nabiax.com',
    confidence: 'official Nabiax contact route',
    subject: 'Iberian hyperscale data centers and location-risk forecasting',
    body: `Hi Nabiax team,

Nabiax's Iberian data-center platform stood out because hyperscale, cloud, and AI infrastructure growth depends on a careful read of power availability, connectivity, sustainability, and local market risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Iberian data-center market signals, site-screening risk, AI-ready capacity planning, or regional expansion forecasting.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'elea-data-centers',
    company: 'Elea Data Centers',
    to: 'contato@eleadatacenters.com',
    confidence: 'official Elea contact route',
    subject: 'Brazil sustainable data centers and AI-ready location risk',
    body: `Hi Elea team,

Elea's Brazil data-center platform stood out because sustainable, AI-ready infrastructure decisions increasingly hinge on power, grid context, connectivity, community factors, and forward-looking market demand.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Brazil data-center demand signals, power-aware site screening, AI infrastructure markets, or expansion prioritization.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'hostdime',
    company: 'HostDime',
    to: 'sales@hostdime.com',
    confidence: 'official HostDime sales route',
    subject: 'Hyper-edge data centers and emerging-market capacity signals',
    body: `Hi HostDime team,

HostDime's hyper-edge data-center strategy stood out because emerging and underserved markets require a sharper read of capacity timing, local demand, network reach, power resilience, and site-level risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around edge data-center demand signals, emerging-market site screening, capacity forecasting, or location intelligence for new facilities.

Would a short conversation be useful, or is there someone on the sales, infrastructure, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'edgeuno',
    company: 'EdgeUno',
    to: 'sales@edgeuno.com',
    confidence: 'official EdgeUno sales route',
    subject: 'LatAm edge infrastructure, connectivity, and location-risk forecasting',
    body: `Hi EdgeUno team,

EdgeUno's Latin America edge and connectivity platform stood out because latency, network density, cloud demand, and local market signals all shape where infrastructure can create the most value.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around LatAm edge demand signals, connectivity-aware location risk, data-center market screening, or expansion forecasting.

Would a short conversation be useful, or is there someone on the sales, network, or strategy side you would point me toward?

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
  console.log(`Sending fifteenth-wave MENA/LatAm digital infrastructure GTM outreach emails from ${profile.data.emailAddress}`);

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
