import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

function encodeMessage({ to, subject, body }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const headers = [
    `To: ${to}`,
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
    key: 'tract',
    company: 'Tract',
    to: 'info@tract.com',
    confidence: 'official get-in-touch route',
    subject: 'Master-planned data center parks and location risk',
    body: `Hi Tract team,

Tract's work on master-planned data center parks, pre-positioned power and fiber, and responsible community-scale infrastructure stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support site, market, entitlement, and community-risk decisions for large-scale data center parks.

Would a short compare-notes call be useful, or is there someone on the development or commercial side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'cyrusone',
    company: 'CyrusOne',
    to: 'info@cyrusone.com',
    confidence: 'official sales and information route',
    subject: 'AI data centers and location risk',
    body: `Hi CyrusOne team,

CyrusOne's global data-center footprint and AI-focused capacity work stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market selection, development-risk planning, or portfolio decisions as AI workloads keep changing site and power requirements.

Would a short compare-notes call be useful, or is there someone on the commercial, development, or strategy side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'ntt-global-data-centers',
    company: 'NTT Global Data Centers',
    to: 'info@nttglobal.net',
    confidence: 'public NTT sales and services route; data-center contact form also available',
    subject: 'Global data centers, AI capacity, and location risk',
    body: `Hi NTT team,

NTT's global data-center platform and U.S. campus footprint stood out, especially as AI demand keeps making power, connectivity, and market selection more strategic.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support site, facility, and portfolio-risk decisions for data-center capacity.

Would a short compare-notes call be useful, or could you point me toward the right Global Data Centers Americas contact?

Best,
Daniel`,
  },
  {
    key: 'iron-mountain-data-centers',
    company: 'Iron Mountain Data Centers',
    to: 'IMDCChannel@ironmountain.com',
    confidence: 'official data-center partner inquiry route',
    subject: 'AI-ready data centers and location risk',
    body: `Hi Iron Mountain Data Centers team,

Iron Mountain's AI-ready data-center work, global portfolio, and partner ecosystem stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support market, site, partner, or portfolio-risk decisions for high-density and AI-oriented capacity.

Would a short compare-notes call be useful, or is there someone on the data-center commercial or partnerships side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'equinix',
    company: 'Equinix',
    to: 'sales@equinix.com',
    confidence: 'public sales route; official contact-sales form also available',
    subject: 'AI-ready data centers and location risk',
    body: `Hi Equinix team,

Equinix's AI-ready data-center work, liquid-cooling readiness, and global interconnection platform stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around how forecasting could support market, facility, and portfolio-risk decisions as AI infrastructure becomes more power- and network-sensitive.

Would a short compare-notes call be useful, or is there someone on the sales, strategy, or data-center planning side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'black-veatch',
    company: 'Black & Veatch',
    to: 'info@bv.com',
    confidence: 'public corporate inquiries route; official site also provides contact form and phone',
    subject: 'Data center power, water, and location risk',
    body: `Hi Black & Veatch team,

Black & Veatch's data-center work across power, water, connectivity, and viable site infrastructure stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support early site screening, infrastructure-risk planning, or market-level data-center decisions.

Would a short compare-notes call be useful, or is there someone on the technology/data centers or infrastructure advisory side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'dpr-construction',
    company: 'DPR Construction',
    to: 'info@dpr.com',
    confidence: 'public corporate route; official site also exposes data-center project/contact forms',
    subject: 'Mission-critical construction and location risk',
    body: `Hi DPR team,

DPR's mission-critical and data-center construction work, including hyperscale and AI-oriented projects, stood out.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support early site, schedule-risk, community-risk, or infrastructure-readiness decisions for data-center projects.

Would a short compare-notes call be useful, or is there someone on the mission-critical/data-center side you would point me toward?

Best,
Daniel`,
  },
  {
    key: 'turner-construction',
    company: 'Turner Construction',
    to: 'turner@tcco.com',
    confidence: 'official general contact route on critical facilities pages',
    subject: 'Critical facilities, AI infrastructure, and location risk',
    body: `Hi Turner team,

Turner's critical-facilities and hyperscale data-center work stood out, especially given the pace of AI infrastructure delivery.

I'm building Homecastr, a probabilistic real-estate forecasting platform focused on forward-looking location and market risk. I thought there might be a useful conversation around where forecasting could support early site, infrastructure-readiness, community-risk, or delivery-risk decisions for data-center projects.

Would a short compare-notes call be useful, or is there someone on the critical-facilities/data-center side you would point me toward?

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
  console.log(`Sending fourth-wave GTM outreach emails from ${profile.data.emailAddress}`);

  for (const message of messages) {
    const rawMessage = encodeMessage(message);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`${message.key}\t${message.company}\t${message.to}\t${res.data.id}\t${message.confidence}`);
  }
})();
