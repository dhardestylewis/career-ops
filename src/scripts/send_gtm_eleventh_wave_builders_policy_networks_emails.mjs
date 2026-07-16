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
    key: 'jobsohio',
    company: 'JobsOhio Data Centers',
    to: 'contact@jobsohio.com',
    confidence: 'official JobsOhio data-center route',
    subject: 'Ohio data-center growth and location-risk forecasting',
    body: `Hi JobsOhio team,

JobsOhio's data-center work stood out because Ohio has become a real battleground for power, land, incentives, workforce, and community readiness as AI and cloud demand keep expanding.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center site screening, market signals, community-readiness risk, or forecasting support for business-attraction work.

Would a short conversation be useful, or is there someone on the technology, data-center, or site-selection side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'team-neo',
    company: 'Team NEO Global Business Development',
    to: 'mmclaughlin@teamneo.org',
    confidence: 'official Team NEO business-development contact',
    subject: 'Northeast Ohio data-center growth and site-readiness signals',
    body: `Hi Mindy,

Team NEO's work around business attraction and recent data-center growth in Northeast Ohio stood out because these projects are increasingly shaped by power readiness, land, community context, and infrastructure timing.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site-readiness signals, market forecasting, community-risk context, or how location intelligence could support data-center and infrastructure-heavy projects.

Would a short conversation be useful, or is there someone on the Team NEO or JobsOhio side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'kc-smartport',
    company: 'KC SmartPort',
    to: 'gutierrez@OneKC.org',
    cc: 'houston@OneKC.org',
    confidence: 'official KC SmartPort leadership contacts',
    subject: 'Kansas City data-center growth, logistics, and location risk',
    body: `Hi Chris and Elli,

KC SmartPort's role in regional industrial growth stood out because Kansas City is now part of the data-center and AI infrastructure conversation, where logistics, power, fiber, land, and local context all matter.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center site screening, market signals, infrastructure readiness, or community-risk forecasting across the KC region.

Would a short conversation be useful, or is there someone on the OneKC, SmartPort, or data-center side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'kc-tech-council-dca',
    company: 'KC Tech Council Data Center Alliance',
    to: 'Erin@kctechcouncil.com',
    cc: 'info@kctechcouncil.com',
    confidence: 'official KC Tech Council Data Center Alliance contact routes',
    subject: 'Kansas City data-center policy, community context, and forecasting',
    body: `Hi Erin,

KC Tech Council's Data Center Alliance stood out because the KC market is facing the exact kind of data-center growth questions where policy, siting, energy, jobs, and community understanding need to move together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around data-center market signals, community-readiness risk, policy context, or how probabilistic location forecasting could help stakeholders evaluate growth.

Would a short conversation be useful, or is there someone in the Data Center Alliance you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'uptime-institute',
    company: 'Uptime Institute',
    to: 'info@uptimeinstitute.com',
    confidence: 'official Uptime Institute general information route',
    subject: 'AI infrastructure advisory and location-risk signals',
    body: `Hi Uptime Institute team,

Uptime Institute's AI infrastructure advisory and data-center resilience work stood out because location risk, power constraints, operating reliability, and long-horizon demand are becoming more connected.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market signals, site and operating risk, AI infrastructure planning, or where probabilistic location forecasting could complement data-center advisory work.

Would a short conversation be useful, or is there someone on the advisory, intelligence, or network side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'afcom',
    company: 'AFCOM',
    to: 'membership@afcom.com',
    confidence: 'public AFCOM team contact route',
    subject: 'Data-center operators, site risk, and market forecasting',
    body: `Hi AFCOM team,

AFCOM stood out because your community sits close to the people operating, expanding, and modernizing critical data-center infrastructure.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around the site, power, weather, community, and market signals operators are trying to understand earlier.

Would a short conversation be useful, or is there someone in the AFCOM network you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'e2-optics',
    company: 'E2 Optics',
    to: 'Sales@E2optics.com',
    confidence: 'official E2 Optics sales route',
    subject: 'Low-voltage delivery, hyperscale buildouts, and location risk',
    body: `Hi E2 Optics team,

E2 Optics' mission-critical and hyperscale data-center work stood out because low-voltage delivery, structured cabling, labor availability, and regional buildout velocity are becoming part of the site-selection equation.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around regional build signals, data-center site risk, labor and delivery constraints, or market forecasting for mission-critical work.

Would a short conversation be useful, or is there someone on the sales, mission-critical, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'salute',
    company: 'Salute',
    to: 'info@salute.com',
    confidence: 'official Salute information route',
    subject: 'Data-center lifecycle operations and AI infrastructure risk',
    body: `Hi Salute team,

Salute's data-center lifecycle and operations work stood out because AI infrastructure growth is making operational readiness, staffing, site risk, and resilience harder to separate.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around operating-risk signals, location-aware infrastructure planning, market demand, or how site-level forecasting could support data-center lifecycle decisions.

Would a short conversation be useful, or is there someone on the operations, advisory, or commercial side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'clayco-compute',
    company: 'Clayco Compute',
    to: 'info@claycorp.com',
    confidence: 'official Clayco project inquiry route',
    subject: 'Mission-critical construction, community context, and location risk',
    body: `Hi Clayco Compute team,

Clayco's mission-critical and data-center construction work stood out because speed-to-market now depends on much more than land: power, permitting, community context, labor, and delivery constraints all matter early.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around construction-market signals, site-screening risk, community-readiness forecasting, or how probabilistic location signals could support early planning.

Would a short conversation be useful, or is there someone on the Clayco Compute, preconstruction, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'holder-construction',
    company: 'Holder Construction Data & Telecom',
    to: 'info@holderconstruction.com',
    confidence: 'public construction directory route, with official site providing data/telecom practice and office contacts',
    subject: 'Data-center construction scale and location-risk forecasting',
    body: `Hi Holder team,

Holder's data and telecom practice stood out because large-scale data-center delivery is becoming a location-risk problem as much as a construction execution problem.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around market signals, power and community risk, construction-readiness constraints, or how location forecasting could support early data-center planning.

Would a short conversation be useful, or is there someone on the data and telecom, preconstruction, or strategy side you would point me toward?

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
  console.log(`Sending eleventh-wave builders/policy/network GTM outreach emails from ${profile.data.emailAddress}`);

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
