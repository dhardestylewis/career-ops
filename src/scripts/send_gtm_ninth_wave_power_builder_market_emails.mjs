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
    key: 'serverfarm',
    company: 'Serverfarm',
    to: 'sales@sfrdc.com',
    confidence: 'official Serverfarm sales route',
    subject: 'AI-ready campuses, high-density capacity, and location risk',
    body: `Hi Serverfarm team,

Serverfarm's AI-ready campuses, powered shells, and build-to-suit work stood out, especially as hyperscale and AI workloads make location, power, and community context harder to evaluate early.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site screening, market prioritization, power-aware demand signals, or risk signals for high-density capacity.

Would a short conversation be useful, or is there someone on the sales, real estate, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: '1547-critical-systems-realty',
    company: '1547 Critical Systems Realty',
    to: 'info@1547realty.com',
    confidence: 'public 1547 contact route',
    subject: 'Interconnection assets, adaptive reuse, and location risk',
    body: `Hi 1547 team,

1547's mix of interconnected facilities, carrier hotels, and adaptive data-center assets stood out because those sites have a different risk profile than pure greenfield campuses.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around expansion markets, interconnection-driven demand, adaptive-reuse screening, or community and infrastructure risk.

Would a short conversation be useful, or is there someone on the commercial, real estate, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'lightedge',
    company: 'LightEdge',
    to: 'info@lightedge.com',
    confidence: 'official LightEdge corporate contact route',
    subject: 'Regional data centers and location-risk forecasting',
    body: `Hi LightEdge team,

LightEdge's regional data-center and hybrid infrastructure footprint stood out, especially across markets where compliance, connectivity, and proximity still matter alongside AI-era capacity.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, market prioritization, facility-risk screening, or expansion-market forecasting.

Would a short conversation be useful, or is there someone on the sales, data-center, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'phoenixnap',
    company: 'phoenixNAP',
    to: 'sales@phoenixnap.com',
    confidence: 'official phoenixNAP sales route',
    subject: 'Phoenix colocation, capacity, and location-risk forecasting',
    body: `Hi phoenixNAP team,

phoenixNAP's Phoenix data-center and colocation footprint stood out, especially as the Southwest keeps changing quickly around power, heat, water, and AI infrastructure demand.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market signals, location-risk forecasting, facility demand, or regional capacity planning.

Would a short conversation be useful, or is there someone on the sales or data-center strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'hivelocity',
    company: 'Hivelocity',
    to: 'sales@hivelocity.net',
    confidence: 'public Hivelocity sales route',
    subject: 'Bare metal, colocation, and location-risk signals',
    body: `Hi Hivelocity team,

Hivelocity's bare metal and colocation footprint stood out because infrastructure decisions are becoming more location-sensitive as customers balance latency, resilience, cost, and power availability.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, facility selection, market prioritization, or location-risk forecasting for infrastructure capacity.

Would a short conversation be useful, or is there someone on the sales, infrastructure, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'bluebird',
    company: 'Bluebird Fiber / Bluebird Data Centers',
    to: 'sales@bluebirdnetwork.com',
    confidence: 'public Bluebird sales route from facility listing',
    subject: 'Fiber-connected data centers and regional demand signals',
    body: `Hi Bluebird team,

Bluebird's fiber network and regional data-center assets stood out because connectivity, latency, and regional demand are increasingly important outside the obvious hyperscale hubs.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around demand signals, fiber-adjacent market selection, data-center location risk, or regional expansion planning.

Would a short conversation be useful, or is there someone on the sales, data-center, or network strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'valorc3',
    company: 'ValorC3',
    to: 'info@valorc3.com',
    confidence: 'public company contact route',
    subject: 'Utah colocation and regional infrastructure risk',
    body: `Hi ValorC3 team,

ValorC3's St. George colocation and connectivity work stood out because regional facilities can offer a very different mix of power, risk, cost, and proximity than the larger hub markets.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional demand signals, infrastructure risk, market prioritization, or site-level forecasting.

Would a short conversation be useful, or is there someone on the sales or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'novva',
    company: 'Novva Data Centers',
    to: 'sales@novva.com',
    confidence: 'public Novva sales route',
    subject: 'Wholesale data centers and location-risk forecasting',
    body: `Hi Novva team,

Novva's wholesale and colocation work stood out, particularly the focus on scalable facilities in markets where climate, power, and operating conditions matter.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market screening, site-level risk, power-aware demand signals, or expansion prioritization.

Would a short conversation be useful, or is there someone on the sales, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'pa-data-centers',
    company: 'Pennsylvania Data Center Partners',
    to: 'Info@PADataCenters.com',
    confidence: 'public project contact route',
    subject: 'Pennsylvania data-center sites and location-risk forecasting',
    body: `Hi Pennsylvania Data Center Partners team,

The Pennsylvania Data Center Partners and PowerHouse joint venture stood out because large powered sites need a clear read on market demand, community context, infrastructure timing, and long-horizon location risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site readiness, power-plus-permission risk, market prioritization, or forecasting signals for data-center development.

Would a short conversation be useful, or is there someone on the development or site-selection side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'entergy',
    company: 'Entergy Louisiana and Mississippi Business & Economic Development',
    to: 'mpivach@entergy.com',
    cc: 'egardn1@entergy.com',
    confidence: 'official Entergy business-development contacts',
    subject: 'Data centers, large loads, and location-risk forecasting',
    body: `Hi Michelle and Ed,

Entergy's role in major data-center and industrial large-load growth stood out, especially across Louisiana and Mississippi where power, sites, community context, and infrastructure timing all have to line up.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around large-load site screening, data-center market signals, community-readiness risk, or how forecasting could support economic-development conversations.

Would a short conversation be useful, or is there someone on the business development or industrial accounts side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'tva-economic-development',
    company: 'TVA Economic Development',
    to: 'EconDev@TVA.com',
    confidence: 'official TVA Economic Development route',
    subject: 'Large-load growth and location-risk forecasting',
    body: `Hi TVA Economic Development team,

TVA's economic-development role stood out because large-load growth increasingly depends on power readiness, transmission timing, workforce, land, and local acceptance moving together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center site screening, large-load demand signals, community-readiness risk, or market forecasting across the Valley.

Would a short conversation be useful, or is there someone on the economic-development or large-load planning side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'srp-economic-development',
    company: 'Salt River Project Economic Development',
    to: 'Karla.Moran@srpnet.com',
    cc: 'Marc.Valenzuela@srpnet.com',
    confidence: 'official SRP economic-development contacts',
    subject: 'Greater Phoenix data centers and site-readiness forecasting',
    body: `Hi Karla and Marc,

SRP's economic-development work stood out because Greater Phoenix is a major data-center market where power, water, heat, land, and infrastructure timing all shape siting decisions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site-readiness forecasting, large-load demand signals, community risk, or market-prioritization signals for data-center growth.

Would a short conversation be useful, or is there someone on the economic-development or large-load side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'nv-energy',
    company: 'NV Energy Economic Development',
    to: 'Jeff.brigger@nvenergy.com',
    confidence: 'official NV Energy data-center opportunities contact',
    subject: 'Nevada data centers, power readiness, and location risk',
    body: `Hi Jeff,

NV Energy's data-center opportunities materials stood out because Nevada is exactly the kind of market where power readiness, incentives, water, climate, and community context all need to be weighed early.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site-readiness forecasting, large-load market signals, community risk, or data-center location screening.

Would a short conversation be useful, or is there someone on the economic-development or major accounts side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'xcel-economic-development',
    company: 'Xcel Energy Economic Development',
    to: 'xeed@xcelenergy.com',
    confidence: 'official Xcel economic-development route',
    subject: 'Large-load site selection and location-risk forecasting',
    body: `Hi Xcel Economic Development team,

Xcel's economic-development work stood out because large energy users increasingly need an early read on power readiness, infrastructure timing, incentives, and community context.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center and advanced-industry site screening, large-load demand signals, or location-risk forecasting across your service territory.

Would a short conversation be useful, or is there someone on the economic-development or large-load side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'gpec',
    company: 'Greater Phoenix Economic Council',
    to: 'info@gpec.org',
    confidence: 'public GPEC business support route',
    subject: 'Greater Phoenix data centers and location-risk forecasting',
    body: `Hi GPEC team,

GPEC's data-center market work stood out because Greater Phoenix has become a major hub where power, water, heat, land, workforce, and local market context all matter to site decisions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center market signals, community-readiness risk, site-selection support, or forecasting for infrastructure-heavy growth.

Would a short conversation be useful, or is there someone on the data-center or business-attraction side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'gray',
    company: 'Gray Data Center Market',
    to: 'bburgett@gray.com',
    confidence: 'official Gray data-center market leader contact',
    subject: 'Data-center construction logistics and location risk',
    body: `Hi Ben,

Gray's data-center market work stood out, especially the way construction logistics, outdoor storage, infrastructure timing, and AI-driven demand are all becoming part of the site-selection equation.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around construction-market signals, site-screening risk, logistics constraints, or how location forecasting could support early-stage data-center planning.

Would a short conversation be useful, or is there someone on the data-center strategy or preconstruction side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'hdr-data-centers',
    company: 'HDR Data Centers',
    to: 'jeffrey.blank@hdrinc.com',
    confidence: 'official HDR data-center contact',
    subject: 'Data-center design, sustainability, and location risk',
    body: `Hi Jeff,

HDR's data-center work stood out because design, sustainability, power strategy, and community context increasingly need to be evaluated before a site is fully committed.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site-screening risk, power and sustainability signals, market prioritization, or how forecasting could support early planning for mission-critical facilities.

Would a short conversation be useful, or is there someone on the data-center or mission-critical side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cupertino-electric',
    company: 'Cupertino Electric',
    to: 'info@cei.com',
    confidence: 'official CEI contact route',
    subject: 'Data-center electrical delivery and location-risk forecasting',
    body: `Hi Cupertino Electric team,

CEI's data-center electrical delivery work stood out because power distribution, schedule certainty, supply chain, and regional constraints increasingly influence where capacity can be built.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market signals, power-aware site screening, construction risk, or early forecasting for data-center development.

Would a short conversation be useful, or is there someone on the data-center, energy, or business-development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'henderson-engineers',
    company: 'Henderson Engineers',
    to: 'info@hendersonengineers.com',
    confidence: 'public business listing route',
    subject: 'Mission-critical engineering and data-center location risk',
    body: `Hi Henderson Engineers team,

Henderson's mission-critical engineering work stood out because data-center planning increasingly depends on power, cooling, redundancy, and location risk being evaluated together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around mission-critical site screening, infrastructure risk, power-aware market signals, or forecasting inputs for early design decisions.

Would a short conversation be useful, or is there someone on the mission-critical or business-development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'structure-research',
    company: 'Structure Research',
    to: 'info@structureresearch.net',
    confidence: 'official Structure Research contact route',
    subject: 'AI infrastructure research and location-risk signals',
    body: `Hi Structure Research team,

Structure Research's focus on data centres, hyperscale, cloud, edge, and AI infrastructure stood out because these markets are increasingly constrained by power, geography, and local development context.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market signals, data-center location risk, regional forecasting, or how probabilistic real-estate signals could complement digital-infrastructure research.

Would a short conversation be useful, or is there someone on the research or advisory side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'dcd',
    company: 'DatacenterDynamics',
    to: 'info@datacenterdynamics.com',
    confidence: 'official DCD contact route',
    subject: 'Data-center market intelligence and forecasting',
    body: `Hi DCD team,

DCD's coverage of data-center construction, power, cooling, AI infrastructure, and market development stood out because those threads increasingly converge around location risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market intelligence, location-risk signals, or how forward-looking real-estate forecasting could be useful to data-center operators and developers.

Would a short conversation be useful, or is there someone on the editorial, research, or partnerships side you would point me toward?

Best,
Daniel`,
  },
  {
    key: '7x24-exchange',
    company: '7x24 Exchange',
    to: 'info@7x24exchange.org',
    confidence: 'public 7x24 Exchange contact route',
    subject: 'Mission-critical operators and location-risk signals',
    body: `Hi 7x24 Exchange team,

7x24 Exchange stood out because your network sits close to the people designing, building, operating, and maintaining mission-critical infrastructure.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around the kinds of site, power, community, and market signals that data-center operators are trying to understand earlier.

Would a short conversation be useful, or is there someone in the 7x24 network you would point me toward?

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
  console.log(`Sending ninth-wave power/builder/market-maker GTM outreach emails from ${profile.data.emailAddress}`);

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
