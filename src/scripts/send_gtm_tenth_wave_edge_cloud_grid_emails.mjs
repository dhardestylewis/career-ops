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
    key: 'expedient',
    company: 'Expedient',
    to: 'info@expedient.com',
    confidence: 'public company social/contact route, with official site providing sales forms and phone',
    subject: 'Enterprise cloud, AI services, and data-center location risk',
    body: `Hi Expedient team,

Expedient's enterprise cloud, AI, and national data-center footprint stood out because workload placement is becoming much more tied to regional capacity, resilience, and market context.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center market signals, regional demand, AI workload placement, or location-risk forecasting.

Would a short conversation be useful, or is there someone on the cloud, data-center, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'us-signal',
    company: 'US Signal',
    to: 'info@ussignal.com',
    confidence: 'official US Signal data-center route',
    subject: 'Regional cloud, fiber, and data-center market signals',
    body: `Hi US Signal team,

US Signal's regional cloud, fiber, and data-center footprint stood out because Midwest infrastructure markets are becoming more important as capacity, latency, and resilience needs shift.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, facility-market prioritization, fiber-adjacent site risk, or expansion forecasting.

Would a short conversation be useful, or is there someone on the sales, data-center, or network strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: '1111-systems',
    company: '11:11 Systems',
    to: 'sales@1111systems.com',
    confidence: 'public municipal procurement sales route, with official site providing contact forms',
    subject: 'Resilient cloud platform and location-risk forecasting',
    body: `Hi 11:11 Systems team,

11:11's resilient cloud platform and managed infrastructure work stood out because resilience decisions increasingly depend on geography, power, weather, and market-specific operating context.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional infrastructure signals, cloud and disaster-recovery location risk, or market screening for resilient capacity.

Would a short conversation be useful, or is there someone on the sales, cloud, or infrastructure strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'colohouse',
    company: 'ColoHouse',
    to: 'sales@colohouse.com',
    confidence: 'public ColoHouse sales route; related to the Hivelocity platform',
    subject: 'Colocation, bare metal, and regional demand signals',
    body: `Hi ColoHouse team,

ColoHouse's colocation and bare-metal history, now connected with the Hivelocity platform, stood out because regional infrastructure demand is getting more location-sensitive.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, facility-market screening, colocation site risk, or customer location preferences.

Would a short conversation be useful, or is there someone on the sales, infrastructure, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'datayard',
    company: 'DataYard',
    to: 'hello@datayard.us',
    confidence: 'official DataYard contact route',
    subject: 'Dayton colocation, cloud, and regional infrastructure risk',
    body: `Hi DataYard team,

DataYard's Dayton-based cloud and data-center co-location work stood out because regional facilities can offer a very different mix of proximity, resilience, cost, and local market context.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, local infrastructure risk, colocation market screening, or location-risk forecasting.

Would a short conversation be useful, or is there someone on the partnerships, cloud, or data-center side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'performive',
    company: 'Performive',
    to: 'sales@performive.com',
    confidence: 'public company social sales route',
    subject: 'Managed cloud and data-center workload placement',
    body: `Hi Performive team,

Performive's managed cloud and data-center footprint stood out because customers are rethinking workload placement around compliance, resilience, latency, and operating risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market signals, workload location risk, regional infrastructure demand, or data-center site screening.

Would a short conversation be useful, or is there someone on the sales, cloud, or infrastructure side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'evocative',
    company: 'Evocative',
    to: 'sales@evocative.com',
    confidence: 'official Evocative sales route',
    subject: 'Interconnected colocation, bare metal, and edge markets',
    body: `Hi Evocative team,

Evocative's interconnected colocation, bare metal, and edge infrastructure footprint stood out because demand is spreading across a wider set of markets, not just the obvious hyperscale hubs.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, interconnection-driven market selection, site risk, or expansion prioritization.

Would a short conversation be useful, or is there someone on the sales, real estate, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'colocation-america',
    company: 'Colocation America',
    to: 'Sales@ColocationAmerica.com',
    confidence: 'official Colocation America sales route',
    subject: 'Retail colocation and location-risk forecasting',
    body: `Hi Colocation America team,

Colocation America's retail colocation footprint stood out because smaller and mid-market infrastructure choices still depend heavily on regional risk, connectivity, cost, and demand signals.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around customer demand by market, facility-location risk, regional infrastructure signals, or site-screening inputs.

Would a short conversation be useful, or is there someone on the sales or data-center strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'opus-interactive',
    company: 'Opus Interactive',
    to: 'sales@opusinteractive.com',
    confidence: 'official Opus Interactive sales route',
    subject: 'Sustainable colocation, AI-ready infrastructure, and location risk',
    body: `Hi Opus Interactive team,

Opus Interactive's sustainable colocation and AI-ready infrastructure work stood out because Hillsboro and other regional markets are shaped by power, climate, connectivity, and customer demand in different ways.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, sustainable infrastructure markets, power-aware site risk, or expansion-market forecasting.

Would a short conversation be useful, or is there someone on the sales, infrastructure, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'deft-summit',
    company: 'Deft / Summit',
    to: 'sales@deft.com',
    confidence: 'public Deft/Summit data-center materials sales route',
    subject: 'Cloud repatriation, colocation, and data-center market risk',
    body: `Hi Deft team,

Deft's colocation and cloud-repatriation work stood out because more teams are reconsidering where workloads should physically live as cost, resilience, power, and performance tradeoffs change.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, cloud-exit location risk, data-center site selection, or facility-market screening.

Would a short conversation be useful, or is there someone on the sales, colocation, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'edgeconnex',
    company: 'EdgeConneX',
    to: 'info@edgeconnex.com',
    confidence: 'official EdgeConneX inquiries route',
    subject: 'Edge, hyperscale, AI campuses, and location risk',
    body: `Hi EdgeConneX team,

EdgeConneX's mix of edge, hyperscale, and AI-ready data-center work stood out because the site-selection problem is increasingly about matching location, power, customers, and community context early.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around edge-market signals, hyperscale site screening, AI campus risk, or regional demand forecasting.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: '1623-farnam',
    company: '1623 Farnam',
    to: 'info@1623farnam.com',
    confidence: 'official 1623 Farnam contact route',
    subject: 'Interconnection hub expansion and regional demand signals',
    body: `Hi 1623 Farnam team,

1623 Farnam's Omaha interconnection hub stood out because carrier-dense edge markets can reveal demand and resilience patterns that do not show up in the largest hyperscale regions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around interconnection-driven demand, regional market signals, edge location risk, or expansion forecasting.

Would a short conversation be useful, or is there someone on the sales, interconnection, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'midamerican-energy',
    company: 'MidAmerican Energy Economic Development',
    to: 'Kathryn.Kunert@midamerican.com',
    confidence: 'official MidAmerican economic-development contact',
    subject: 'Large-load site readiness and location-risk forecasting',
    body: `Hi Kathryn,

MidAmerican's economic-development work stood out because large-load projects increasingly need a clear early view of power readiness, site constraints, local context, and long-horizon market risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around large-load site screening, data-center demand signals, community-readiness risk, or forecasting support for business attraction.

Would a short conversation be useful, or is there someone on the economic-development or large-load planning side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'gridlab',
    company: 'GridLab',
    to: 'hello@gridlab.org',
    confidence: 'official GridLab contact route',
    subject: 'Grid transformation, load growth, and location-risk signals',
    body: `Hi GridLab team,

GridLab's grid-transformation work stood out because data-center and AI load growth is making geography, transmission, weather, and local market context much more important to planning conversations.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around load-growth signals, location risk, grid-aware market forecasting, or how real-estate and infrastructure signals could support planning work.

Would a short conversation be useful, or is there someone in the GridLab network you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'esig',
    company: 'Energy Systems Integration Group',
    to: 'info@esig.energy',
    confidence: 'official ESIG information route from public publications',
    subject: 'Data-center load integration and planning signals',
    body: `Hi ESIG team,

ESIG's work on integrated planning and emerging load integration stood out because data-center and AI growth is turning location, timing, power availability, and system risk into a shared planning problem.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center load-growth signals, grid-aware location risk, integrated planning inputs, or where probabilistic market forecasting could be useful.

Would a short conversation be useful, or is there someone in the ESIG network you would point me toward?

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
  console.log(`Sending tenth-wave edge/cloud/grid GTM outreach emails from ${profile.data.emailAddress}`);

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
