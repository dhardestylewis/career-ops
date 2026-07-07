import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

const TARGETS = [
  { key: 'columbia-tech-ventures', to: 'techventures@columbia.edu', subject: 'Homecastr routing for SBIR/STTR and Columbia commercialization support' },
  { key: 'columbia-l2m-routing', to: 'L2M@ctv.columbia.edu', subject: 'Homecastr routing to Lab-to-Market and commercialization support' },
  { key: 'columbia-alumni-routing', to: 'cce-alumni@columbia.edu', subject: 'Columbia alumni routing for Homecastr' },
  { key: 'columbia-dsi-routing', to: 'datascience@columbia.edu', subject: 'Columbia routing help for Homecastr and NSF follow-on' },
  { key: 'ali-hirsa-update', to: 'ah2347@columbia.edu', subject: 'Homecastr update and follow-on routing' },
  { key: 'christopher-munsell-update', to: 'cwm2132@columbia.edu', subject: 'Homecastr update and follow-on routing' },
  { key: 'paola-passalacqua-update', to: 'ppassalacqua@ethz.ch', subject: 'Homecastr update and follow-on routing' },
];

function getHeader(message, name) {
  return message?.payload?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

(async () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log(`Sending Columbia / NSF drafts from ${profile.data.emailAddress}`);

  const draftList = await gmail.users.drafts.list({ userId: 'me', maxResults: 100 });
  const drafts = [];
  for (const item of draftList.data.drafts ?? []) {
    const draft = await gmail.users.drafts.get({ userId: 'me', id: item.id });
    const message = draft.data.message;
    drafts.push({
      id: item.id,
      to: normalize(getHeader(message, 'To')),
      subject: normalize(getHeader(message, 'Subject')),
    });
  }

  for (const target of TARGETS) {
    const match = drafts.find((draft) => draft.to === normalize(target.to) && draft.subject === normalize(target.subject));
    if (!match) {
      console.log(`${target.key}\tnot-found`);
      continue;
    }

    const sent = await gmail.users.drafts.send({
      userId: 'me',
      requestBody: { id: match.id },
    });

    console.log([target.key, match.id, sent.data.id || '', sent.data.message?.threadId || ''].join('\t'));
  }
})();
