import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

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
    key: 'dominion-energy-economic-development',
    company: 'Dominion Energy Economic Development',
    to: 'kevin.c.carter.jr@dominionenergy.com',
    cc: 'gizelle.f.curtis@dominionenergy.com, eric.s.bateman@dominionenergy.com',
    confidence: 'official Dominion Energy economic-development mailto routes',
    subject: 'Data center requests, power, and location risk',
    body: `Hi Kevin,

Dominion Energy's data-center request and economic-development work stood out because utility readiness, site feasibility, and local approval risk are now tightly linked.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for data-center site screening, power-aware market prioritization, or community-readiness signals before a project becomes hard to change.

Would a short conversation be useful, or is there someone on the data-center request or economic-development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'vedp-data-centers',
    company: 'Virginia Economic Development Partnership Data Centers',
    to: 'vbarnett@vedp.org',
    cc: 'fpopoola@vedp.org',
    confidence: 'official VEDP data-center contact routes',
    subject: 'Virginia data centers and location-risk forecasting',
    body: `Hi Vince,

VEDP's data-center work stood out because Virginia remains a global hub for digital infrastructure while power, permitting, and community context are becoming more important to site decisions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support site-screening, regional risk analysis, community-readiness, or the next wave of data-center market selection.

Would a short conversation be useful, or is there someone else on the data-center or strategic-projects team you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'loudoun-county-economic-development',
    company: 'Loudoun County Economic Development',
    to: 'buddy.rizer@loudoun.gov',
    confidence: 'official Loudoun County economic-development staff route',
    subject: 'Data centers, community risk, and market forecasting',
    body: `Hi Buddy,

Loudoun's data-center market leadership stood out, especially as the next phase of AI infrastructure creates more tension between growth, grid capacity, land use, and community expectations.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for community-readiness, market constraints, data-center development risk, or how regions can evaluate projects earlier and with more context.

Would a short conversation be useful, or is there someone on the economic-development or data-center ecosystem side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'prince-william-economic-development',
    company: 'Prince William County Economic Development',
    to: 'econdev@pwcgov.org',
    confidence: 'official Prince William County economic-development route',
    subject: 'Data center development and location-risk signals',
    body: `Hi Prince William Economic Development team,

Prince William County's data-center development activity stood out because the market is increasingly shaped by power access, zoning, infrastructure readiness, and community transparency.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support site-screening, public-facing project context, or early risk analysis for data-center development.

Would a short conversation be useful, or is there someone on the business investment, planning, or data-center side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'oncor-economic-development',
    company: 'Oncor Economic Development',
    to: 'EcoDev@oncor.com',
    confidence: 'official Oncor economic-development route',
    subject: 'Power-intensive sites and location risk',
    body: `Hi Oncor Economic Development team,

Oncor's economic-development work in Texas stood out because power-intensive site decisions are becoming one of the biggest constraints for AI, data-center, and advanced industrial growth.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for power-aware site screening, market prioritization, and community-readiness signals for high-load projects.

Would a short conversation be useful, or is there someone on the economic-development or large-load side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'duke-energy-nc-economic-development',
    company: 'Duke Energy North Carolina Economic Development',
    to: 'NCEconomicDevelopmentTeam@duke-energy.com',
    confidence: 'public economic-development team route',
    subject: 'Site readiness, data centers, and location-risk forecasting',
    body: `Hi Duke Energy Economic Development team,

Duke Energy's site-readiness work stood out, especially as large-load and data-center projects increasingly need earlier views into power, land, infrastructure, and community constraints.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support site readiness, high-load project screening, or regional risk analysis before a project is deep in process.

Would a short conversation be useful, or is there someone on the Carolinas economic-development or data-center side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'aep-data-center-integration',
    company: 'AEP Economic Development and Data Center Integration',
    to: 'zcmiller@aep.com',
    confidence: 'official AEP economic-development and data-center-integration route',
    subject: 'Data center integration and location-risk forecasting',
    body: `Hi Zach,

Your data-center integration role at AEP stood out because utility-side site selection is now central to whether AI and hyperscale projects can move from interest to real delivery.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for power-aware site screening, regional risk, infrastructure readiness, and community-readiness signals for large-load projects.

Would a short conversation be useful, or is there someone else on the AEP economic-development team you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'site-selection-group-data-centers',
    company: 'Site Selection Group Data Center Practice',
    to: 'mrareshide@siteselectiongroup.com',
    cc: 'jconnelly@siteselectiongroup.com',
    confidence: 'official Site Selection Group data-center practice routes',
    subject: 'Data center site selection and forecastable risk',
    body: `Hi Michael,

Site Selection Group's data-center practice stood out because the work sits exactly at the intersection of power, incentives, land, market constraints, and mission-critical real estate.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how probabilistic forecasting could complement data-center site selection by flagging market, infrastructure, regulatory, or community risk earlier in the process.

Would a short conversation be useful, or is there someone else on the data-center advisory side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'data-center-coalition',
    company: 'Data Center Coalition',
    to: 'membership@datacentercoalition.org',
    confidence: 'official Data Center Coalition membership route',
    subject: 'Data center growth, community context, and forecasting',
    body: `Hi Data Center Coalition team,

DCC's role as a data-center industry voice stood out because the industry's next growth phase is increasingly shaped by clean energy access, local policy, workforce, infrastructure, and community trust.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support better early visibility into community-readiness, market constraints, and siting risk for data-center growth.

Would a short conversation be useful, or is there someone on the policy, member engagement, or research side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'nvtc-data-center-cloud',
    company: 'NVTC Data Center and Cloud Community',
    to: 'kwynn@nvtc.org',
    confidence: 'official NVTC data-center report contact route',
    subject: 'Virginia data-center research and location-risk forecasting',
    body: `Hi Kimberly,

NVTC's Data Center and Cloud work stood out, especially the research and convening around Virginia's data-center ecosystem.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around where forecasting could support data-center market research, community-readiness analysis, or early risk signals for infrastructure growth.

Would a short conversation be useful, or is there someone on the Data Center and Cloud community side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'nixon-peabody-data-center-site-selection',
    company: 'Nixon Peabody Data Center Site Selection',
    to: 'jprisco@nixonpeabody.com',
    confidence: 'public author contact route on data-center site-selection guidance',
    subject: 'Data center site selection and power-plus-permission risk',
    body: `Hi Julianne,

Your recent data-center site-selection guidance stood out, especially the framing that power access now has to be evaluated alongside regulatory, legislative, political, and community risk.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support earlier visibility into site viability, community-readiness, and policy-sensitive real-estate risk for data-center projects.

Would a short conversation be useful, or is there someone else in the energy or real-estate practice you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'newmark-global-strategy-data-centers',
    company: 'Newmark Global Strategy Data Centers',
    to: 'robert.hess@nmrk.com',
    confidence: 'official Newmark data-center site-selection contacts document route',
    subject: 'Data center site selection and location-risk forecasting',
    body: `Hi Robert,

Newmark's data-center site-selection and global strategy work stood out because the sector is now being shaped by power access, permitting, land, capital, and regional constraints at once.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around where forecasting could complement data-center site selection, market prioritization, or risk screening for infrastructure and real-estate decisions.

Would a short conversation be useful, or is there someone else on the data-center or global strategy side you would point me toward?

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
  console.log(`Sending seventh-wave market-maker GTM outreach emails from ${profile.data.emailAddress}`);

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
