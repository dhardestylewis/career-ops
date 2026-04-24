import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');
const STATE_PATH = path.resolve('data/followups_state.json');

(async () => {
    try {
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        
        let state = {};
        if (fs.existsSync(STATE_PATH)) {
            state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
        }

        console.log("Scanning inbox for application confirmations...\n");
        // Query for common ATS confirmation subjects within the last 48 hours
        const query = '(subject:"application" OR subject:"applying" OR subject:"received") (from:greenhouse.io OR from:lever.co OR from:ashbyhq.com OR from:workday.com OR subject:"thank you") newer_than:2d';
        
        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 50,
            q: query
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) {
            console.log('No recent application confirmations found.');
            return;
        }

        const newApps = [];

        for (const message of messages) {
            if (state[message.id]) continue; // Already processed

            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
            });
            
            const headers = msg.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers.find(h => h.name === 'Date')?.value || 'Unknown Date';
            
            // Basic extraction heuristics
            let company = "Unknown";
            let role = "Unknown";
            
            // Example Subject: "Thank you for applying to the Staff ML Engineer role at Waymo"
            // Example Subject: "Your application to Figma"
            const companyMatch = subject.match(/(?:at|to) ([A-Z][a-zA-Z0-9\s]+?)(?: role| position|!|$)/);
            if (companyMatch) company = companyMatch[1].trim();
            
            // Try to pull company from the sender name "Figma Recruiting <no-reply@greenhouse.io>"
            if (company === "Unknown") {
                const fromMatch = from.match(/^"?([a-zA-Z0-9\s]+?)(?:\sRecruiting|\sCareers|\sTalent|\sTeam)?\s*</i);
                if (fromMatch) company = fromMatch[1].trim();
            }

            // Extract Body to find role
            let body = '';
            if (msg.data.payload.parts) {
                const part = msg.data.payload.parts.find(p => p.mimeType === 'text/plain');
                if (part && part.body.data) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf8');
                }
            } else if (msg.data.payload.body.data) {
                body = Buffer.from(msg.data.payload.body.data, 'base64').toString('utf8');
            }

            if (role === "Unknown" && body) {
                const roleMatch = body.match(/applying (?:for|to) the (.*?)(?: position| role)/i);
                if (roleMatch) role = roleMatch[1].trim();
            }

            newApps.push({
                id: message.id,
                date: date,
                company: company,
                role: role,
                subject: subject,
                from: from
            });

            // Mark as seen
            state[message.id] = { processed: new Date().toISOString(), company, subject };
        }

        fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

        if (newApps.length > 0) {
            console.log(`Found ${newApps.length} new applications to follow up on:\n`);
            newApps.forEach(app => {
                console.log(`[COMPANY]: ${app.company}`);
                console.log(`[ROLE]:    ${app.role}`);
                console.log(`[SUBJECT]: ${app.subject}`);
                console.log(`[DATE]:    ${app.date}`);
                console.log(`[ID]:      ${app.id}`);
                console.log(`------------------------------------------`);
            });
        } else {
            console.log('No *new* applications found to follow up on.');
        }

    } catch (err) {
        console.error('The API returned an error: ' + err);
    }
})();
