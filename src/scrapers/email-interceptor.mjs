import fs from 'fs';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TOKEN_PATH = path.resolve(__dirname, '../../token.json');
const CREDENTIALS_PATH = path.resolve(__dirname, '../../credentials.json');

const extractVerificationCode = (bodyText = '') => {
    const normalized = String(bodyText || '');
    if (!/(code|verif|human)/i.test(normalized)) return null;

    const potentialMatches = normalized.match(/\b[A-Za-z0-9]{8}\b|\b\d{6}\b/g) || [];
    for (const match of potentialMatches) {
        if (match.length === 6 && /^\d+$/.test(match)) {
            return match;
        }
        if (match.length === 8 && /[0-9]/.test(match) && /[a-zA-Z]/.test(match)) {
            return match;
        }
    }

    return null;
};

const decodeGmailPayloadText = (payload = {}) => {
    const decodePart = (data) => {
        if (!data) return '';
        return Buffer.from(data, 'base64').toString('utf8');
    };

    const parts = payload.parts || [];
    for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
            return decodePart(part.body.data);
        }
    }
    for (const part of parts) {
        if (part.body?.data) {
            return decodePart(part.body.data);
        }
    }
    if (payload.body?.data) {
        return decodePart(payload.body.data);
    }
    return '';
};

async function waitForVerificationCodeViaGmailApi(emailAddress, maxWaitSeconds = 60) {
    if (!fs.existsSync(TOKEN_PATH) || !fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ Gmail API credentials not found. Skipping Gmail API verification fallback.');
        return null;
    }

    try {
        const { google } = await import('googleapis');
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token);
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const endTime = Date.now() + (maxWaitSeconds * 1000);
        const minMessageTime = Date.now() - (2 * 60 * 1000);
        const seenIds = new Set();
        console.log(`[Email Interceptor] Falling back to Gmail API for ${emailAddress} (Timeout: ${maxWaitSeconds}s)...`);

        while (Date.now() < endTime) {
            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 10,
                q: 'newer_than:2d (from:no-reply@us.greenhouse-mail.io OR from:no-reply@greenhouse.io) "security code"',
            });
            const messages = res.data.messages || [];
            for (const message of messages) {
                if (!message.id || seenIds.has(message.id)) continue;
                seenIds.add(message.id);
                const full = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'full',
                });
                const internalDate = Number(full.data.internalDate || 0);
                if (internalDate && internalDate < minMessageTime) {
                    continue;
                }
                const bodyText = decodeGmailPayloadText(full.data.payload || {});
                const code = extractVerificationCode(bodyText);
                if (code) {
                    console.log(`✅ [Email Interceptor] Extracted validation hook via Gmail API: ${code}`);
                    return code;
                }
            }
            await new Promise(r => setTimeout(r, 4000));
        }
    } catch (err) {
        console.error('❌ [Email Interceptor] Gmail API fallback failed: ', err.message);
    }

    return null;
}

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
        console.error("❌ IMAP_APP_PASSWORD not found in .env. Trying Gmail API fallback.");
        return await waitForVerificationCodeViaGmailApi(emailAddress, maxWaitSeconds);
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
                    extractedCode = extractVerificationCode(bodyText);
                    if (extractedCode) {
                        console.log(`✅ [Email Interceptor] Successfully extracted validation hook: ${extractedCode}`);
                        // Consume the signal so we don't accidentally reuse it next run
                        await client.messageFlagsAdd(latestSeq, ['\\Seen']);
                        break;
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
        return await waitForVerificationCodeViaGmailApi(emailAddress, maxWaitSeconds);
    }
}
