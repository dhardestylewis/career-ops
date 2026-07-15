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
    subject: 'Homecastr and Columbia commercialization support',
    body: `Hi CTV team,

I am a recent Columbia alum building Homecastr, a probabilistic property-forecasting platform. I am preparing an NSF SBIR/STTR Project Pitch and wanted to ask for the best Columbia contact or program for commercialization review, letters of support, and any Lab-to-Market or accelerator program that fits this venture.

If there is a better contact than this inbox, I would appreciate the pointer. I can send a short one-pager and the draft Project Pitch immediately.

Best,
Daniel`,
  },
  {
    key: 'columbia-l2m-routing',
    to: 'L2M@ctv.columbia.edu',
    subject: 'Homecastr and Lab-to-Market support',
    body: `Hi Lab-to-Market team,

I am a recent Columbia alum building Homecastr, a probabilistic property-forecasting platform. I am preparing an NSF SBIR/STTR Project Pitch and wanted to ask whether there is an L2M accelerator or a better Columbia contact for commercialization support.

If there is a better contact or a member program I should be speaking with, I would appreciate the pointer. I can send a short one-pager and the draft Project Pitch immediately.

Best,
Daniel`,
  },
  {
    key: 'columbia-alumni-routing',
    to: 'cce-alumni@columbia.edu',
    subject: 'Homecastr and Columbia alumni support',
    body: `Hi Columbia alumni team,

I am a recent Columbia alum building Homecastr and wanted to ask who in the Columbia commercialization or alumni network is best positioned to point me to the right contact. If there is a better office or person for startup-oriented alumni support, could you point me there?

Best,
Daniel`,
  },
  {
    key: 'columbia-dsi-routing',
    to: 'datascience@columbia.edu',
    subject: 'Homecastr and Columbia DSI support',
    body: `Hi DSI team,

I am a recent Columbia alum and am trying to find the right Columbia programs for Homecastr. I have a Columbia research bridge and am preparing NSF SBIR/STTR materials. If there is a better contact in IEOR, GSAPP, or DSI, or a lab or program I should be talking to, I would appreciate a pointer.

Best,
Daniel`,
  },
  {
    key: 'ali-hirsa-update',
    to: 'ah2347@columbia.edu',
    subject: 'Re: Homecastr update',
    body: `Hi Ali,

I’m following up because I’d value your advice on the best Columbia contact or program for Homecastr. You’ve been close enough to the Columbia ecosystem that I thought you might have a clear sense of who is best positioned to point me in the right direction.

If a specific person or program comes to mind, I’d really appreciate the pointer.

Best,
Daniel`,
  },
  {
    key: 'christopher-munsell-update',
    to: 'cwm2132@columbia.edu',
    subject: 'Re: Homecastr update',
    body: `Hi Christopher,

I’m following up because your GSAPP work on real estate finance and AI in the classroom made you the person I’d most want to ask about the best Columbia contact or program for Homecastr.

If there is someone specific I should speak with, I would really appreciate the pointer.

Best,
Daniel`,
  },
  {
    key: 'paola-passalacqua-update',
    to: 'ppassalacqua@ethz.ch',
    subject: 'Re: Homecastr update',
    body: `Hi Paola,

I’m following up because your work on hydrology and river-system science at ETH made you the person I’d most want to ask about the right academic or commercialization contact for Homecastr.

If there is someone specific you would point me to, I would really appreciate the pointer.

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
