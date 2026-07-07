import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

const TARGETS = [
  { key: 'columbia-tech-ventures', auditQueries: ['techventures@columbia.edu'], to: 'techventures@columbia.edu', subject: 'Homecastr routing for SBIR/STTR and Columbia commercialization support' },
  { key: 'columbia-l2m-routing', auditQueries: ['L2M@ctv.columbia.edu'], to: 'L2M@ctv.columbia.edu', subject: 'Homecastr routing to Lab-to-Market and commercialization support' },
  { key: 'columbia-alumni-routing', auditQueries: ['cce-alumni@columbia.edu'], to: 'cce-alumni@columbia.edu', subject: 'Columbia alumni routing for Homecastr' },
  { key: 'columbia-dsi-routing', auditQueries: ['datascience@columbia.edu'], to: 'datascience@columbia.edu', subject: 'Columbia routing help for Homecastr and NSF follow-on' },
  { key: 'ali-hirsa-update', auditQueries: ['Ali Hirsa', 'ah2347@columbia.edu'], to: 'ah2347@columbia.edu', subject: 'Homecastr update and follow-on routing' },
  { key: 'christopher-munsell-update', auditQueries: ['Christopher Munsell', 'cwm2132@columbia.edu'], to: 'cwm2132@columbia.edu', subject: 'Homecastr update and follow-on routing' },
  { key: 'paola-passalacqua-update', auditQueries: ['Paola Passalacqua', 'ppassalacqua@ethz.ch'], to: 'ppassalacqua@ethz.ch', subject: 'Homecastr update and follow-on routing' },
];

function getHeader(message, name) {
  return message?.payload?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function runRecipientAudit(query) {
  try {
    const stdout = execFileSync('node', ['src/dataOps/outreach-recipient-audit.mjs', query, '--json'], {
      encoding: 'utf8',
    });
    return { ok: true, data: JSON.parse(stdout) };
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 1;
    const stdout = String(error.stdout || '').trim();
    const stderr = String(error.stderr || '').trim();
    let data = null;
    if (stdout) {
      try {
        data = JSON.parse(stdout);
      } catch {
        data = null;
      }
    }
    return { ok: false, status, stdout, stderr, data };
  }
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
    const auditQueries = target.auditQueries?.length ? target.auditQueries : [target.to];
    let blockedAudit = null;

    for (const query of auditQueries) {
      const audit = runRecipientAudit(query);
      if (audit.ok) continue;
      if (audit.status === 2 || audit.status === 3) {
        blockedAudit = {
          query,
          status: audit.status,
          verdict: audit.data?.verdict || 'blocked',
          nextStep: audit.data?.nextStep || audit.stderr || '',
        };
        break;
      }
      throw new Error(`Recipient audit failed for ${target.key} (${query}): ${audit.stderr || audit.stdout || `exit ${audit.status}`}`);
    }

    if (blockedAudit) {
      console.log([target.key, 'skipped', `audit-${blockedAudit.status}`, blockedAudit.query, blockedAudit.verdict, blockedAudit.nextStep].join('\t'));
      continue;
    }

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
