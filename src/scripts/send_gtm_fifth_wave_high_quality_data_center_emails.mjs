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
    key: 'prime-data-centers',
    company: 'Prime Data Centers',
    to: 'info@primedatacenters.com',
    confidence: 'official contact route',
    subject: 'AI-ready campuses and location risk',
    body: `Hi Prime team,

Prime's work on AI-ready, large-scale data center campuses and customer-led market expansion stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market-fit, power-aware siting, entitlement-risk, or portfolio decisions for hyperscale and AI capacity.

Would a short compare-notes call be useful, or is there someone on the commercial or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'h5-data-centers',
    company: 'H5 Data Centers',
    to: 'info@h5datacenters.com',
    confidence: 'official corporate contact route',
    subject: 'Data center markets and location risk',
    body: `Hi H5 team,

H5's national data-center footprint across wholesale, colocation, and edge markets stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market prioritization, facility-risk analysis, or portfolio planning as demand keeps shifting with AI and cloud workloads.

Would a short compare-notes call be useful, or is there someone on the sales, strategy, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 't5-data-centers',
    company: 'T5 Data Centers',
    to: 'info@t5datacenters.com',
    confidence: 'public company materials and contact-sales form route',
    subject: 'Integrated data center delivery and location risk',
    body: `Hi T5 team,

T5's integrated model across development, construction, and operations stood out, especially for AI-era delivery timelines.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support site strategy, development-risk planning, or market selection before major data-center capital is committed.

Would a short compare-notes call be useful, or is there someone on the properties, services, or sales side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'ecl',
    company: 'ECL',
    to: 'info@ecldc.com',
    confidence: 'official contact route',
    subject: 'Off-grid AI data centers and location risk',
    body: `Hi ECL team,

ECL's hydrogen-powered and flex-grid data-center model stood out because it changes the usual power, water, and site-feasibility equation.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market selection, community-risk screening, or site prioritization for off-grid and AI-oriented data-center capacity.

Would a short compare-notes call be useful, or is there someone on the TerraSite, partnerships, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'edged',
    company: 'Edged',
    to: 'contact@edged.us',
    confidence: 'official public contact email',
    subject: 'Waterless AI-ready data centers and location risk',
    body: `Hi Edged team,

Edged's AI-ready facilities and waterless cooling model stood out, especially as water, power, and community constraints become bigger parts of site viability.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market selection, site-risk screening, or community-readiness decisions for high-density data-center growth.

Would a short compare-notes call be useful, or is there someone on the U.S. development or commercial side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'aecom-data-centers',
    company: 'AECOM Data Centers',
    to: 'Teresa.lanuza@aecom.com',
    cc: 'Mario.sawaya@aecom.com',
    confidence: 'official data-center contact routes',
    subject: 'Data center infrastructure and location risk',
    body: `Hi Teresa,

AECOM's data-center work across energy, water, fiber, environmental services, and construction stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support early site screening, infrastructure-readiness analysis, or market-level data-center decisions.

Would a short conversation be useful, or is there someone else on the data-center infrastructure side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'syska-critical-facilities',
    company: 'Syska Hennessy Critical Facilities',
    to: 'info@syska.com',
    confidence: 'official business-development contact route',
    subject: 'Critical facilities engineering and location risk',
    body: `Hi Syska team,

Syska's critical-facilities work across hyperscale, colocation, and enterprise data centers stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could complement MEP and critical-facilities planning by screening market, power, site, and community risk earlier in the project lifecycle.

Would a short compare-notes call be useful, or is there someone on the critical facilities or business development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'transwestern-technology-properties',
    company: 'Transwestern Technology Properties Group',
    to: 'Andrew.Marcus@transwestern.com',
    cc: 'Todd.Smith@transwestern.com',
    confidence: 'official direct data-center advisory contacts',
    subject: 'Technology properties, data centers, and location risk',
    body: `Hi Andrew,

Transwestern's Technology Properties Group stood out for connecting real estate, critical infrastructure, and data-center advisory.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support site selection, market intelligence, tenant advisory, or development-risk work for technology-oriented properties.

Would a short compare-notes call be useful, or is there someone else on the Technology Properties team you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'georgia-power-data-centers',
    company: 'Georgia Power Data Center Economic Development',
    to: 'tkielty@southernco.com',
    cc: 'amvarnum@southernco.com',
    confidence: 'official Georgia data-center site-selection contacts',
    subject: 'Data center site selection and location risk in Georgia',
    body: `Hi Taylor and Ashley,

Georgia Power's data-center site-selection work stood out, especially given how power readiness, infrastructure planning, and community impact now drive data-center decisions.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support site screening, market-risk analysis, or community-readiness planning for data-center growth.

Would a short conversation be useful, or is there someone else on the economic development or data-center team you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'burns-mcdonnell-mission-critical',
    company: 'Burns & McDonnell Mission Critical',
    to: 'info@burnsmcd.com',
    confidence: 'public corporate contact route; official data-center page provides mission-critical contact form',
    subject: 'Data center power, delivery, and location risk',
    body: `Hi Burns & McDonnell team,

Your mission-critical data-center work stood out, especially the focus on power access, speed to market, and integrated design-build delivery.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support early site screening, power-aware market selection, or development-risk planning for data-center projects.

Would a short compare-notes call be useful, or is there someone on the mission-critical or data-center team you would point me toward?

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
  console.log(`Sending fifth-wave high-quality GTM outreach emails from ${profile.data.emailAddress}`);

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
