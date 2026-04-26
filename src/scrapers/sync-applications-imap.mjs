import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CAREER_OPS = path.resolve(__dirname, '../..');
const TRACKER_DIR = path.join(CAREER_OPS, 'batch', 'tracker-additions');

export async function syncHistoricalApplications() {
    const emailAddress = process.env.EMAIL_ADDRESS || 'daniel@homecastr.com';
    const password = process.env.IMAP_APP_PASSWORD;
    if (!password) {
        console.error("❌ IMAP_APP_PASSWORD not found in .env. Cannot sync historical applications.");
        return;
    }

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: emailAddress, pass: password },
        logger: false
    });

    console.log(`[IMAP Sync] Authenticating dynamically with ${emailAddress}...`);
    
    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        console.log(`[IMAP Sync] Connected. Scanning for 'Application Received' or 'Thank you for applying' patterns...`);

        // Search for emails indicating application receipts
        const searchCriteria = {
            or: [
                { subject: 'Application' },
                { subject: 'Applying' },
                { subject: 'received your application' }
            ]
        };

        let foundCount = 0;
        const knownCompanies = new Set();
        
        for await (const message of client.fetch(searchCriteria, { envelope: true })) {
            const subject = message.envelope.subject || '';
            const date = new Date(message.envelope.date).toISOString().split('T')[0];
            
            // Regex heuristics to extract Company and Role from Subject
            // "Thank you for applying to Baseten"
            // "Application received: Forward Deployed Engineer at Unstructured"
            // "Your application to LlamaIndex"
            
            let company = 'Unknown';
            let role = 'Unknown Role';

            const thankYouMatch = subject.match(/applying to (.*?)(?:\s*-|\s*$)/i);
            const receivedMatch = subject.match(/received.*(?:for|:)\s*(.*?) at (.*?)(?:\s*$)/i);
            const yourAppMatch = subject.match(/application to (.*?)(?:\s*-|\s*$)/i);

            if (receivedMatch) {
                role = receivedMatch[1].trim();
                company = receivedMatch[2].trim();
            } else if (thankYouMatch) {
                company = thankYouMatch[1].trim();
            } else if (yourAppMatch) {
                company = yourAppMatch[1].trim();
            }

            if (company !== 'Unknown' && !knownCompanies.has(company)) {
                knownCompanies.add(company);
                foundCount++;
                
                // Write directly to a TSV file in tracker-additions so merge-tracker.mjs can ingest and deduplicate it natively
                const cleanCompany = company.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const tsvPath = path.join(TRACKER_DIR, `imap_sync_${cleanCompany}_${date}.tsv`);
                const content = `999\t${date}\t${company}\t${role}\tApplied\t0.0\t-\t-\tRecovered via IMAP Historical Sync\n`;
                
                if (!fs.existsSync(tsvPath)) {
                    fs.writeFileSync(tsvPath, content);
                    console.log(`✅ [IMAP Sync] Found historical application: ${company} (${role}). Generated tracker file.`);
                }
            }
        }

        lock.release();
        await client.logout();
        console.log(`\n==================================`);
        console.log(`[IMAP Sync] Complete! Processed ${foundCount} application receipts.`);
        console.log(`Run 'npm run merge' or 'node src/dataOps/merge-tracker.mjs' to sync them to applications.md.`);
        
    } catch (err) {
        console.error("❌ [IMAP Sync] Error during sync: ", err.message);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    syncHistoricalApplications();
}
