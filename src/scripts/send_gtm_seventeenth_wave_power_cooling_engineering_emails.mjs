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
    key: 'power-wsp-data-center-power',
    bucket: 'Power Engineering / Data Center Advisory',
    company: 'POWER Engineers / WSP / kW Mission Critical',
    to: 'paul.compton@powereng.com',
    cc: 'chad.elder@powereng.com, adam.benson@powereng.com, michael.thomas@wsp.com',
    confidence: 'official POWER + WSP data-center power contacts page',
    subject: 'Data-center power planning and location-risk forecasting',
    body: `Hi Paul,

The POWER + WSP data-center energy work stood out because AI campuses increasingly have to screen power, transmission, on-site generation, permitting, environmental constraints, and real-estate timing together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk signals could support data-center power planning, site screening, customer advisory work, or early market prioritization.

Would a short conversation be useful, or is there someone on the POWER, WSP, or kW Mission Critical side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'motivair-liquid-cooling',
    bucket: 'Power / Cooling Vendor',
    company: 'Motivair by Schneider Electric',
    to: 'info@motivaircorp.com',
    confidence: 'official Motivair sales and general inquiries route',
    subject: 'Liquid cooling, AI density, and location-risk signals',
    body: `Hi Motivair team,

Motivair's liquid-cooling work stood out because AI and HPC growth is making cooling strategy, power availability, facility readiness, and regional deployment timing much more tightly coupled.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how site and market-risk signals could complement high-density cooling planning, customer prioritization, or expansion screening.

Would a short conversation be useful, or is there someone on the data-center, sales, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'delta-data-center-solutions',
    bucket: 'Power / Cooling Vendor',
    company: 'Delta Electronics Data Center Solutions',
    to: 'datacenter.solution@deltaww.com',
    confidence: 'official Delta Americas data-center solutions inquiry route',
    subject: 'Modular data centers and power-aware site forecasting',
    body: `Hi Delta Data Center Solutions team,

Delta's modular data-center infrastructure work stood out because deployment speed increasingly depends on power, cooling, permitting, land, utility readiness, and local market conditions lining up early.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how location-risk signals could support modular data-center planning, edge/hyperscale site screening, or customer expansion prioritization.

Would a short conversation be useful, or is there someone on the data-center solutions side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'siemens-energy-data-centers',
    bucket: 'Power Infrastructure Vendor',
    company: 'Siemens Energy Data Center Power Solutions',
    to: 'support@siemens-energy.com',
    confidence: 'official Siemens Energy technical and sales support route',
    subject: 'Data-center power solutions and location-risk forecasting',
    body: `Hi Siemens Energy team,

Siemens Energy's data-center power work stood out because AI campuses now need earlier coordination across grid connection, on-site generation, storage, backup power, decarbonization, and deployment timing.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how probabilistic location signals could support data-center power planning, customer advisory, market screening, or project-risk context.

Would a short conversation be useful, or is there someone on the data-center power solutions side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'solar-turbines-data-center-power',
    bucket: 'Power Infrastructure Vendor',
    company: 'Solar Turbines',
    to: 'infocorp@solarturbines.com',
    confidence: 'Solar Turbines product and case-study materials list this corporate inquiry route',
    subject: 'Gas-turbine data-center power and site-risk forecasting',
    body: `Hi Solar Turbines team,

Solar Turbines' standby and modular power-generation work stood out because data-center developers are increasingly weighing grid timelines, on-site generation, fuel access, permitting, emissions, and site constraints together.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how site and market-risk signals could support data-center power planning, customer screening, or early project prioritization.

Would a short conversation be useful, or is there someone on the power generation or data-center side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'oncor-economic-development',
    bucket: 'Utility / Economic Development',
    company: 'Oncor Economic Development',
    to: 'contactcenter@oncor.com',
    confidence: 'official Oncor contact route with economic-development pathway',
    subject: 'Texas data-center load growth and location-risk forecasting',
    body: `Hi Oncor team,

Oncor's economic-development work stood out because Texas data-center and large-load activity is putting power delivery, interconnection timing, land, permitting, and community readiness into the same early screening process.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support large-load site screening, data-center market signals, or economic-development project context.

Would a short conversation be useful, or could you route me to the Oncor economic-development team?

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
  console.log(`Sending seventeenth-wave power/cooling/engineering GTM outreach emails from ${profile.data.emailAddress}`);

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
