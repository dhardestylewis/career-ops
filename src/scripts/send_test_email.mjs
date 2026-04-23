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
        
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const myEmail = profile.data.emailAddress;

        console.log(`Sending test email to ${myEmail}...`);

        const subject = 'Test Email from Career Ops';
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: ${myEmail}`,
            `To: ${myEmail}`,
            'Content-Type: text/plain; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            'This is a test email sent autonomously from the Career Ops local pipeline!',
            'If you are reading this, the Gmail API integration has full read/write capabilities.',
        ];
        const message = messageParts.join('\n');

        // Encode to base64url format required by Gmail API
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log(`✅ Success! Email sent with Message ID: ${res.data.id}`);
    } catch (err) {
        console.error('The API returned an error: ' + err);
    }
})();
