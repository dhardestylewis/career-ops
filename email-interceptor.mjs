import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Headless 2FA IMAP Interceptor
 * 
 * Securely polls standard INBOX for generic automated Verification Codes. 
 * Extracts 6-8 digit alphanumeric codes universally standard to Lever/Greenhouse/Ashby.
 *  
 * @param {string} emailAddress Target inbox map  
 * @param {number} maxWaitSeconds How long to block executing evaluating pipeline
 */
export async function waitForVerificationCode(emailAddress, maxWaitSeconds = 60) {
    const password = process.env.IMAP_APP_PASSWORD;
    if (!password) {
        console.error("❌ IMAP_APP_PASSWORD not found in .env. Skipping automated email intercept.");
        return null;
    }

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: emailAddress,
            pass: password
        },
        logger: false // Suppress raw socket logs to keep batch output clean
    });

    console.log(`[Email Interceptor] Authenticating dynamically with ${emailAddress} via App Password...`);
    
    try {
        await client.connect();
        
        let lock = await client.getMailboxLock('INBOX');
        const endTime = Date.now() + (maxWaitSeconds * 1000);
        let extractedCode = null;

        console.log(`[Email Interceptor] Listening for inbound 2FA payload (Timeout: ${maxWaitSeconds}s)...`);

        while (Date.now() < endTime && !extractedCode) {
            // Find ALL unread messages received roughly recently
            // Note: IMAP standard 'since' only resolves to days, so we fetch unread and post-filter locally
            const sequenceNumbers = [];
            for await (const message of client.fetch({ seen: false }, { envelope: true })) {
                // Defensive filter: Ensure the email is extremely recent (last 15 mins) to avoid caching stale codes
                if (Date.now() - new Date(message.envelope.date).getTime() < 15 * 60 * 1000) {
                    sequenceNumbers.push(message.seq);
                }
            }

            if (sequenceNumbers.length > 0) {
                // Fetch the source of the most extremely recent email
                const latestSeq = sequenceNumbers[sequenceNumbers.length - 1];
                const msgStream = await client.fetchOne(latestSeq, { source: true });
                if (msgStream && msgStream.source) {
                    const parsed = await simpleParser(msgStream.source);
                    const bodyText = parsed.text || parsed.html || '';

                    // ATS platforms deploy strict 8-character (e.g. jB9m2Pq1) or 6-digit layouts
                    // Ashby specifically utilizes 8-character alphanumeric boundaries.
                    // We hunt strictly near keywords to prevent false positives from URLs/IDs.
                    if (bodyText.toLowerCase().includes('code') || bodyText.toLowerCase().includes('verif') || bodyText.toLowerCase().includes('human')) {
                        const codeRegex = /\b[A-Za-z0-9]{8}\b|\b\d{6}\b/g;
                        const potentialMatches = bodyText.match(codeRegex) || [];
                        
                        // Filter out obviously non-code strings (e.g. completely lowercase random english words)
                        for (const match of potentialMatches) {
                            if (match.length === 6 && /^\d+$/.test(match)) {
                                extractedCode = match; break;
                            }
                            if (match.length === 8 && /[0-9]/.test(match) && /[a-zA-Z]/.test(match)) {
                                extractedCode = match; break;
                            }
                        }

                        if (extractedCode) {
                            console.log(`✅ [Email Interceptor] Successfully extracted validation hook: ${extractedCode}`);
                            // Consume the signal so we don't accidentally reuse it next run
                            await client.messageFlagsAdd(latestSeq, ['\\Seen']);
                            break;
                        }
                    }
                }
            }

            await new Promise(r => setTimeout(r, 4000)); // Non-aggressive polling delay
        }

        lock.release();
        await client.logout();
        return extractedCode;

    } catch (err) {
        console.error("❌ [Email Interceptor] Critical Connection failure: ", err.message);
        return null;
    }
}
