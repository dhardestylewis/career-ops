import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

(async () => {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error("No credentials.json found in root directory.");
        return;
    }

    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf8');
        oAuth2Client.setCredentials(JSON.parse(token));
        console.log("Token already exists. Testing connection...");
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        try {
            const profile = await gmail.users.getProfile({ userId: 'me' });
            console.log(`✅ Successfully authenticated as ${profile.data.emailAddress}`);
        } catch (e) {
            console.error("Token is invalid or expired. Delete token.json and rerun.");
        }
    } else {
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
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
                console.log('Token stored to', TOKEN_PATH);
                console.log('✅ Authentication complete!');
            });
        });
    }
})();
