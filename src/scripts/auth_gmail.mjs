import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import { resolveGmailAuthLocation } from './gmail-auth.mjs';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

(async () => {
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

  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
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
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
      console.log('Token stored to', tokenPath);
      console.log('✅ Authentication complete!');
    });
  });
})();
