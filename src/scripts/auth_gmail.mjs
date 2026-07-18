import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import { resolveGmailAuthLocation } from './gmail-auth.mjs';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

(async () => {
  const forceReauth = process.argv.includes('--force') || process.argv.includes('--reauth');
  const location = resolveGmailAuthLocation({ requireToken: false });
  if (!location?.credentialsPath) {
    console.error('No Gmail credentials.json found in the current root or mirrored workspace.');
    return;
  }

  const content = fs.readFileSync(location.credentialsPath, 'utf8');
  const credentials = JSON.parse(content);
  const oauth = credentials.installed || credentials.web || credentials;
  const redirectUris = oauth.redirect_uris || oauth.redirectUris || [];
  const redirectUri = redirectUris[0] || oauth.redirect_uri || oauth.redirectUri || 'http://localhost';
  const oAuth2Client = new google.auth.OAuth2(oauth.client_id, oauth.client_secret, redirectUri);

  const tokenPath = location.tokenPath || path.join(path.dirname(location.credentialsPath), 'token.json');
  const existingToken = fs.existsSync(tokenPath)
    ? JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
    : null;

  if (existingToken && !forceReauth) {
    const grantedScopes = new Set(String(existingToken.scope || '').split(/\s+/).filter(Boolean));
    const missingScopes = SCOPES.filter((scope) => !grantedScopes.has(scope));
    if (missingScopes.length > 0) {
      console.error('Token already exists but is missing required scopes:');
      for (const scope of missingScopes) {
        console.error(`- ${scope}`);
      }
      console.error(`Run node src/scripts/auth_gmail.mjs --force to re-authorize and update ${tokenPath}.`);
      process.exit(2);
    }

    oAuth2Client.setCredentials(existingToken);
    console.log('Token already exists. Testing connection...');
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      console.log(`✅ Successfully authenticated as ${profile.data.emailAddress}`);
      console.log(`Auth source: ${location.source}`);
    } catch (e) {
      console.error(`Token is invalid or expired. Delete ${tokenPath} and rerun.`);
    }
    return;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    include_granted_scopes: true,
    prompt: forceReauth ? 'consent' : undefined,
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:\n');
  console.log(authUrl);
  console.log('\nAfter authorizing, you will be redirected to localhost (which will fail to load). Copy the "code=" parameter from the URL bar and paste it below.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      if (existingToken?.refresh_token && !token.refresh_token) {
        token.refresh_token = existingToken.refresh_token;
      }
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
      console.log('Token stored to', tokenPath);
      console.log('✅ Authentication complete!');
    });
  });
})();
