import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

function encodeMessage({ to, subject, body }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const headers = [
    to ? `To: ${to}` : null,
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

const drafts = [
  {
    key: 'columbia-tech-ventures',
    to: 'techventures@columbia.edu',
    subject: 'Homecastr routing for SBIR/STTR and Columbia commercialization support',
    body: `Hi CTV team,

I am a recent Columbia alum building Homecastr, a probabilistic property-forecasting platform. I am preparing an NSF SBIR/STTR Project Pitch and wanted to ask for the best Columbia route for commercialization review, letters of support, and any Lab-to-Market or accelerator program that fits this venture.

If there is a better contact than this inbox, I would appreciate the pointer. I can send a short one-pager and the draft Project Pitch immediately.

Best,
Daniel`,
  },
  {
    key: 'columbia-l2m-routing',
    to: 'L2M@ctv.columbia.edu',
    subject: 'Homecastr routing to Lab-to-Market and commercialization support',
    body: `Hi Lab-to-Market team,

I am a recent Columbia alum building Homecastr, a probabilistic property-forecasting platform. I am preparing an NSF SBIR/STTR Project Pitch and wanted to ask whether there is an L2M accelerator or commercialization route that fits this venture.

If there is a better contact or a member program I should be speaking with, I would appreciate the pointer. I can send a short one-pager and the draft Project Pitch immediately.

Best,
Daniel`,
  },
  {
    key: 'columbia-alumni-routing',
    to: 'cce-alumni@columbia.edu',
    subject: 'Columbia alumni routing for Homecastr',
    body: `Hi Columbia alumni team,

I am a recent Columbia alum building Homecastr and trying to route the venture to the right Columbia commercialization and alumni contacts. If there is a better office or person for startup-oriented alumni support, could you point me there?

Best,
Daniel`,
  },
  {
    key: 'columbia-dsi-routing',
    to: 'datascience@columbia.edu',
    subject: 'Columbia routing help for Homecastr and NSF follow-on',
    body: `Hi DSI team,

I am a recent Columbia alum and am trying to route Homecastr through the right Columbia programs. I have a Columbia research bridge and am preparing NSF SBIR/STTR materials. If there is a better contact in IEOR, GSAPP, or DSI, or a lab or program I should be talking to, I would appreciate a pointer.

Best,
Daniel`,
  },
  {
    key: 'ali-hirsa-update',
    to: 'ah2347@columbia.edu',
    subject: 'Homecastr update and follow-on routing',
    body: `Hi Ali,

I wanted to send a quick Homecastr update and ask for the best Columbia route for follow-on commercialization support. The venture is now in the NSF SBIR/STTR / Project Pitch lane, and I am tightening the Columbia program routing around it.

If a specific person or program comes to mind, I would really appreciate the pointer.

Best,
Daniel`,
  },
  {
    key: 'christopher-munsell-update',
    to: 'cwm2132@columbia.edu',
    subject: 'Homecastr update and follow-on routing',
    body: `Hi Christopher,

I wanted to send a quick Homecastr update and ask for the best Columbia route for follow-on commercialization support. The venture is now in the NSF SBIR/STTR / Project Pitch lane, and I am tightening the Columbia program routing around it.

If a specific person or program comes to mind, I would really appreciate the pointer.

Best,
Daniel`,
  },
  {
    key: 'paola-passalacqua-update',
    to: 'ppassalacqua@ethz.ch',
    subject: 'Homecastr update and follow-on routing',
    body: `Hi Paola,

I wanted to send a quick Homecastr update and ask for the best Columbia route for follow-on commercialization support. The venture is now in the NSF SBIR/STTR / Project Pitch lane, and I am tightening the Columbia program routing around it.

If a specific person or program comes to mind, I would really appreciate the pointer.

Best,
Daniel`,
  },
];

function getHeader(message, name) {
  return message?.payload?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

(async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log(`Creating Columbia / NSF drafts in ${profile.data.emailAddress}`);

  const existingDrafts = await gmail.users.drafts.list({ userId: 'me', maxResults: 100 });
  const existingKeys = new Set();
  for (const draft of existingDrafts.data.drafts ?? []) {
    const fullDraft = await gmail.users.drafts.get({ userId: 'me', id: draft.id });
    const message = fullDraft.data.message;
    const key = `${getHeader(message, 'To').toLowerCase()}|${getHeader(message, 'Subject').toLowerCase()}`;
    existingKeys.add(key);
  }

  for (const draft of drafts) {
    const key = `${draft.to.toLowerCase()}|${draft.subject.toLowerCase()}`;
    if (existingKeys.has(key)) {
      console.log(`${draft.key}\tskipped\texisting draft found`);
      continue;
    }

    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodeMessage(draft),
        },
      },
    });

    console.log(`${draft.key}\t${res.data.id}\t${res.data.message?.id || ''}`);
  }
})();
