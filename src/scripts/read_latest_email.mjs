import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

(async () => {
    try {
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        
        console.log("Checking for recent emails...\n");
        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 3,
            q: 'is:inbox'
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) {
            console.log('No recent messages found.');
            return;
        }

        for (const message of messages) {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
            });
            const headers = msg.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers.find(h => h.name === 'Date')?.value || 'Unknown Date';
            console.log(`From: ${from}`);
            console.log(`Subject: ${subject}`);
            console.log(`Date: ${date}\n-------------------\n`);
        }
    } catch (err) {
        console.error('The API returned an error: ' + err);
    }
})();
