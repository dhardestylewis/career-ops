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
    key: 'applied-digital',
    company: 'Applied Digital',
    to: 'info@applieddigital.com',
    confidence: 'official corporate contact route',
    subject: 'AI Factories, power, and location risk',
    body: `Hi Applied Digital team,

Applied Digital's AI Factory work stood out, especially the translation of power availability and development execution into operational AI capacity.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support market selection, power-aware siting, entitlement risk, or community-readiness screening for AI infrastructure.

Would a short conversation be useful, or is there someone on the data-center, strategy, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'core-scientific',
    company: 'Core Scientific',
    to: 'sales@corescientific.com',
    confidence: 'official sales route',
    subject: 'High-density AI data centers and location risk',
    body: `Hi Core Scientific team,

Core Scientific's move from large-scale digital infrastructure into high-density AI data centers stood out, especially around pre-secured power and campus scalability.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support power-aware site selection, expansion-market prioritization, or risk screening for AI/HPC data-center growth.

Would a short compare-notes call be useful, or is there someone on the sales, strategy, or development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'terawulf',
    company: 'TeraWulf',
    to: 'info@terawulf.com',
    confidence: 'official corporate information route',
    subject: 'AI/HPC infrastructure and location risk',
    body: `Hi TeraWulf team,

TeraWulf's AI/HPC infrastructure work stood out, particularly the way power-first site strategy is becoming central to large-scale AI capacity.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for site prioritization, local-market risk, power-aware expansion, or community-readiness screening for AI data-center campuses.

Would a short conversation be useful, or is there someone on the infrastructure, business development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'coreweave',
    company: 'CoreWeave',
    to: 'sales@coreweave.com',
    confidence: 'public sales route in company materials; official contact-sales form also available',
    subject: 'AI cloud capacity and location risk',
    body: `Hi CoreWeave team,

CoreWeave's AI cloud growth stood out because infrastructure capacity, power access, and market-level deployment risk are increasingly strategic constraints.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support cluster/site expansion, market prioritization, or real-estate risk screening behind AI capacity growth.

Would a short conversation be useful, or is there someone on the infrastructure, capacity, or partnerships side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'lambda',
    company: 'Lambda',
    to: 'sales@lambdalabs.com',
    confidence: 'public sales route in company materials; official contact form also available',
    subject: 'GPU cloud infrastructure and location risk',
    body: `Hi Lambda team,

Lambda's GPU cloud and AI infrastructure work stood out, especially as cluster expansion increasingly depends on power, cooling, interconnection, and market readiness.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support data-center market selection, site-risk screening, or infrastructure planning for GPU capacity growth.

Would a short conversation be useful, or is there someone on the infrastructure, partnerships, or sales side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'hut-8',
    company: 'Hut 8',
    to: 'info@hut8.com',
    confidence: 'official project inquiry route',
    subject: 'AI data-center campuses and location risk',
    body: `Hi Hut 8 team,

Hut 8's AI data-center campus work stood out, especially the power-first development model behind large-scale projects like River Bend and Beacon Point.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market selection, power-aware site screening, entitlement/community risk, or portfolio planning for AI infrastructure.

Would a short compare-notes call be useful, or is there someone on the development, data-center, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'soluna',
    company: 'Soluna',
    to: 'hello@soluna.io',
    confidence: 'official general contact route',
    subject: 'Renewable AI infrastructure and location risk',
    body: `Hi Soluna team,

Soluna's model of turning renewable power into modular data-center capacity for AI and high-performance computing stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around site prioritization, local-market risk, community-readiness screening, or project-level forecasting where power and real estate intersect.

Would a short conversation be useful, or is there someone on the project development or commercial side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'bitdeer-ai',
    company: 'Bitdeer AI',
    to: 'aisales@bitdeer.com',
    confidence: 'official AI sales route',
    subject: 'AI data centers and location risk',
    body: `Hi Bitdeer AI team,

Bitdeer's AI data-center and cloud-service work stood out, especially where power infrastructure, colocation strategy, and market expansion meet.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around forecasting for data-center site selection, regional risk, power-aware expansion, or community-readiness screening.

Would a short conversation be useful, or is there someone on the AI, data-center, or business development side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cipher-mining-ai',
    company: 'Cipher Mining',
    to: 'business@ciphermining.com',
    confidence: 'official business inquiries route',
    subject: 'AI/HPC data centers and location risk',
    body: `Hi Cipher team,

Cipher's industrial-scale infrastructure and AI/HPC hosting work stood out, especially as power-rich sites become a scarce input for data-center growth.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful compare-notes conversation around how forecasting could support site selection, local-market risk analysis, power-aware expansion, or community-readiness screening.

Would a short conversation be useful, or is there someone on the business development, data-center, or strategy side you would point me toward?

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
  console.log(`Sending sixth-wave AI infrastructure GTM outreach emails from ${profile.data.emailAddress}`);

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
