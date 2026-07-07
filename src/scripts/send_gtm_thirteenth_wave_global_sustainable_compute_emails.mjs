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
    key: 'ecodatacenter',
    company: 'EcoDataCenter',
    to: 'sales@ecodatacenter.se',
    confidence: 'official EcoDataCenter sales route',
    subject: 'Sustainable high-density data centres and location-risk forecasting',
    body: `Hi EcoDataCenter team,

EcoDataCenter's sustainable high-density facilities stood out because AI and HPC growth is making power, climate, grid context, and long-horizon location risk central to data-centre decisions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-centre market signals, power-aware site risk, sustainability context, or expansion-market forecasting.

Would a short conversation be useful, or is there someone on the sales, strategy, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'green-mountain',
    company: 'Green Mountain',
    to: 'simon.justnes@greenmountain.no',
    confidence: 'official Green Mountain commercial leadership contact',
    subject: 'Nordic renewable data centres and AI/HPC location risk',
    body: `Hi Simon,

Green Mountain's renewable-powered data-centre platform stood out because Nordic markets are becoming strategically important for AI and HPC workloads, especially where power, cooling, connectivity, and community context all matter.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market screening, data-centre demand signals, power-aware location risk, or sustainability-linked site selection.

Would a short conversation be useful, or is there someone on the commercial or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'kao-data',
    company: 'Kao Data',
    to: 'info@kaodata.com',
    confidence: 'official Kao Data contact route',
    subject: 'AI and advanced-compute data centres in the UK',
    body: `Hi Kao Data team,

Kao Data's focus on AI and advanced-compute data centres stood out because these workloads make location, power density, resilience, and regional market dynamics unusually important.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around AI infrastructure market signals, site-level risk, regional demand, or location forecasting for advanced compute.

Would a short conversation be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'ark-data-centres',
    company: 'Ark Data Centres',
    to: 'info@arkdatacentres.co.uk',
    confidence: 'official Ark Data Centres sales/contact route',
    subject: 'UK sovereign data centres and resilient location planning',
    body: `Hi Ark Data Centres team,

Ark's UK data-centre platform stood out because sovereign, secure, and resilient infrastructure decisions increasingly depend on location, power, operating risk, and local market context.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site-screening signals, resilience risk, data-centre market forecasting, or power-aware location strategy.

Would a short conversation be useful, or is there someone on the sales, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'maincubes',
    company: 'maincubes',
    to: 'sales@maincubes.com',
    confidence: 'official maincubes sales route',
    subject: 'Germany/EU cloud and AI data-centre market signals',
    body: `Hi maincubes team,

maincubes' cloud and AI data-centre work stood out because European capacity planning is increasingly shaped by power availability, grid timing, permitting, sustainability, and regional demand.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around EU data-centre market signals, location-risk forecasting, power-aware market screening, or expansion prioritization.

Would a short conversation be useful, or is there someone on the sales, strategy, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'verne',
    company: 'Verne',
    to: 'info@verne.co',
    confidence: 'official Verne enquiries and sales route',
    subject: 'Renewable-powered HPC colocation and market screening',
    body: `Hi Verne team,

Verne's renewable-powered colocation and high-performance compute platform stood out because AI and HPC workloads make location, climate, power, and connectivity central to the customer decision.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around HPC market signals, power-aware location risk, sustainability context, or how customers evaluate regional capacity.

Would a short conversation be useful, or is there someone on the commercial, partnerships, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'bulk-infrastructure',
    company: 'Bulk Infrastructure',
    to: 'post@bulk.no',
    confidence: 'official Bulk Infrastructure contact route',
    subject: 'Nordic AI-ready data centres, fiber, and industrial real estate',
    body: `Hi Bulk Infrastructure team,

Bulk's combination of Nordic data centres, fiber networks, and industrial real estate stood out because AI-ready infrastructure increasingly depends on power, connectivity, land, and local market context moving together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around Nordic market signals, power and fiber-adjacent site risk, AI/HPC capacity planning, or industrial-infrastructure forecasting.

Would a short conversation be useful, or is there someone on the data-centre, fiber, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'africa-data-centres',
    company: 'Africa Data Centres',
    to: 'enquiries@africadatacentres.com',
    confidence: 'official Africa Data Centres enquiry route',
    subject: 'Pan-African data-centre markets and location-risk forecasting',
    body: `Hi Africa Data Centres team,

Africa Data Centres' pan-African footprint stood out because emerging data-centre markets need a careful read on connectivity, power, customer demand, regulatory context, and long-horizon location risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional market signals, facility demand, location-risk forecasting, or market-prioritization inputs for data-centre growth.

Would a short conversation be useful, or is there someone on the commercial, strategy, or market-development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'virtus-data-centres',
    company: 'VIRTUS Data Centres',
    to: 'sales@virtusdcs.com',
    confidence: 'official VIRTUS sales route',
    subject: 'UK and European HPC/data-centre capacity and location risk',
    body: `Hi VIRTUS team,

VIRTUS' UK and European data-centre platform stood out because HPC, cloud, and AI workloads are making power, density, permitting, and regional market context more important to capacity planning.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-centre market signals, site-risk screening, power-aware demand forecasting, or location strategy for high-density capacity.

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
  console.log(`Sending thirteenth-wave global sustainable compute GTM outreach emails from ${profile.data.emailAddress}`);

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
