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
    key: 'oge-economic-development',
    bucket: 'Utility / Economic Development',
    company: 'OG&E Economic Development',
    to: 'weaveran@oge.com',
    cc: 'idlemacb@oge.com, eldridj@oge.com',
    confidence: 'official OG&E economic-development team mailto routes',
    subject: 'Large-load site readiness and location-risk forecasting',
    body: `Hi Alba,

OG&E's economic-development work stood out because large-load projects now depend on a sharper read of power availability, site readiness, community context, and timing risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support high-load site screening, data-center market signals, RFP response data, or community-readiness analysis.

Would a short conversation be useful, or is there someone on the economic-development or large-load side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'nppd-economic-development',
    bucket: 'Utility / Economic Development',
    company: 'Nebraska Public Power District Economic Development',
    to: 'njsedla@nppd.com',
    cc: 'mltrueb@nppd.com, smgrote@nppd.com',
    confidence: 'official NPPD economic-development team routes',
    subject: 'Site readiness, electric load, and location-risk forecasting',
    body: `Hi Nicole,

NPPD's economic-development and site-readiness work stood out because power-intensive projects increasingly need earlier visibility into electric load, infrastructure timing, workforce, land, and community context.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site-readiness signals, electric-load attraction, market screening, or forecasting for high-load industrial and data-center opportunities.

Would a short conversation be useful, or is there someone else on the NPPD economic-development team you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'edpnc-business-development',
    bucket: 'Economic Development',
    company: 'Economic Development Partnership of North Carolina',
    to: 'bryn.covington@edpnc.com',
    confidence: 'official EDPNC business-development route shown on site-selection pages',
    subject: 'Megasites, power constraints, and location-risk forecasting',
    body: `Hi Bryn,

EDPNC's site-selection and megasite work stood out because data centers and advanced industrial projects increasingly need earlier reads on power, permitting, workforce, land, and local-market risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support site screening, regional market prioritization, data-center readiness, or project-risk context before a location decision is locked.

Would a short conversation be useful, or is there someone on the business-development or site-selection side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'lge-ku-economic-development',
    bucket: 'Utility / Economic Development',
    company: 'LG&E and KU Business and Economic Development',
    to: 'mary.dennis@lge-ku.com',
    confidence: 'official LG&E and KU economic-development contact route',
    subject: 'Kentucky data-center growth and site-readiness signals',
    body: `Hi Mary Beth,

LG&E and KU's Team Opportunity Kentucky work stood out because Kentucky's new hyperscale data-center activity makes power readiness, site development, incentives, and community context especially important.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around high-load site readiness, data-center market signals, power-aware location risk, or early project-screening context.

Would a short conversation be useful, or is there someone else on the business and economic-development team you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'vertiv',
    bucket: 'Power / Cooling Vendor',
    company: 'Vertiv',
    to: 'contact@vertiv.com',
    confidence: 'official Vertiv contact route',
    subject: 'AI data-center capacity, power, and location-risk signals',
    body: `Hi Vertiv team,

Vertiv's critical digital-infrastructure work stood out because AI data-center growth is putting power, cooling, deployment timing, and site constraints into the same decision loop.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk signals could complement power and thermal planning, deployment prioritization, or market screening for high-density infrastructure.

Would a short conversation be useful, or is there someone on the data-center, commercial, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'liquidstack',
    bucket: 'Power / Cooling Vendor',
    company: 'LiquidStack',
    to: 'info@liquidstack.com',
    confidence: 'official LiquidStack commercial inquiries route',
    subject: 'Liquid cooling, AI density, and site-risk forecasting',
    body: `Hi LiquidStack team,

LiquidStack's liquid-cooling work stood out because high-density AI infrastructure is making power, thermal design, water, location, and deployment timing tightly coupled.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how market and site-risk signals could support AI-density planning, facility prioritization, or expansion screening alongside cooling strategy.

Would a short conversation be useful, or is there someone on the commercial, data-center, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'submer',
    bucket: 'Power / Cooling Vendor',
    company: 'Submer',
    to: 'contact@submer.com',
    confidence: 'official Submer contact route',
    subject: 'Immersion cooling and power-aware site forecasting',
    body: `Hi Submer team,

Submer's liquid-cooling platform stood out because AI and high-density workloads are forcing data-center teams to evaluate cooling, power, sustainability, and site constraints much earlier.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forward-looking location signals could complement immersion-cooling adoption, AI campus planning, or regional expansion screening.

Would a short conversation be useful, or is there someone on the data-center, commercial, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'zutacore',
    bucket: 'Power / Cooling Vendor',
    company: 'ZutaCore',
    to: 'info@zutacore.com',
    confidence: 'official ZutaCore general inquiries route',
    subject: 'Waterless cooling, AI sites, and location-risk forecasting',
    body: `Hi ZutaCore team,

ZutaCore's waterless direct-to-chip cooling work stood out because AI infrastructure decisions increasingly sit at the intersection of compute density, power, water, heat reuse, and local site conditions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how market and site-risk forecasting could support AI infrastructure planning, regional prioritization, or customer site screening.

Would a short conversation be useful, or is there someone on the sales, partnerships, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'stonepeak',
    bucket: 'Digital Infrastructure Investor',
    company: 'Stonepeak',
    to: 'information@stonepeak.com',
    confidence: 'official Stonepeak inquiries route',
    subject: 'Digital infrastructure diligence and location-risk forecasting',
    body: `Hi Stonepeak team,

Stonepeak's digital-infrastructure investment work stood out because data centers, fiber, small cells, and related platforms are increasingly shaped by power access, permitting, community context, and market timing.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how probabilistic location signals could support digital-infrastructure diligence, market screening, or portfolio expansion decisions.

Would a short conversation be useful, or is there someone on the digital-infrastructure investment or operating side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'antin',
    bucket: 'Digital Infrastructure Investor',
    company: 'Antin Infrastructure Partners',
    to: 'contact@antin-ip.com',
    confidence: 'official Antin contact route',
    subject: 'Infrastructure investing and forecastable location risk',
    body: `Hi Antin team,

Antin's infrastructure investment focus stood out because digital, energy, transport, and social infrastructure decisions increasingly depend on local-market dynamics that can change materially before assets are built or expanded.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk forecasting could support infrastructure diligence, digital-infrastructure screening, or operating-plan decisions.

Would a short conversation be useful, or is there someone on the digital or infrastructure investment side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'brookfield-infrastructure',
    bucket: 'Digital Infrastructure Investor',
    company: 'Brookfield Infrastructure',
    to: 'bip.enquiries@brookfield.com',
    confidence: 'official Brookfield Infrastructure inquiries route',
    subject: 'AI infrastructure, power constraints, and location-risk forecasting',
    body: `Hi Brookfield Infrastructure team,

Brookfield Infrastructure's data and AI infrastructure footprint stood out because power availability, grid investment, site readiness, and local approval risk are becoming central to the next wave of digital-infrastructure value creation.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk signals could support AI infrastructure diligence, market prioritization, or operating decisions across data-center and power-linked assets.

Would a short conversation be useful, or is there someone on the data infrastructure, operating, or investment side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cvc-dif',
    bucket: 'Digital Infrastructure Investor',
    company: 'CVC DIF',
    to: 'cvcinfra-info@cvc.com',
    confidence: 'official CVC DIF investor relations and business-development route',
    subject: 'Digital infrastructure and location-risk forecasting',
    body: `Hi CVC DIF team,

CVC DIF's infrastructure strategy stood out because digital-infrastructure investments increasingly need to evaluate power, land, policy, demand timing, and community constraints together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk forecasting could support digital-infrastructure diligence, market screening, or portfolio growth planning.

Would a short conversation be useful, or is there someone on the infrastructure investment or business-development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'gi-partners-data-infrastructure',
    bucket: 'Digital Infrastructure Investor',
    company: 'GI Partners Data Infrastructure',
    to: 'PR@gipartners.com',
    confidence: 'official GI Partners contact route',
    subject: 'Data infrastructure markets and location-risk forecasting',
    body: `Hi GI Partners team,

GI Partners' data-infrastructure strategy stood out because data centers, data transport, wireless access, and tech-enabled infrastructure all depend on market timing, power, local approval context, and site-level risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk signals could support data-infrastructure diligence, market prioritization, or operating-company expansion planning.

Would a short conversation be useful, or is there someone on the data-infrastructure investment or operating side you would point me toward?

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
  console.log(`Sending sixteenth-wave utility/power/investor infrastructure GTM outreach emails from ${profile.data.emailAddress}`);

  for (const message of messages) {
    const rawMessage = encodeMessage(message);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log([
      message.key,
      message.bucket,
      message.company,
      message.to,
      message.cc ?? '',
      res.data.id,
      message.confidence,
    ].join('\t'));
  }
})();
