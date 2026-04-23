import { chromium } from 'playwright';
import { populateGreenhouse } from '../scrapers/auto-fill-greenhouse.mjs';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.resolve('token.json');
const CREDENTIALS_PATH = path.resolve('credentials.json');

async function getLatestGreenhouseCode() {
    console.log("Polling Gmail for the Greenhouse 6-digit code...");
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Poll up to 15 times (30 seconds)
    for (let i = 0; i < 15; i++) {
        try {
            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 5,
                q: 'from:no-reply@greenhouse.io subject:"verify your email"'
            });
            const messages = res.data.messages || [];
            if (messages.length > 0) {
                const msg = await gmail.users.messages.get({
                    userId: 'me',
                    id: messages[0].id,
                    format: 'full'
                });
                
                // Parse the payload body
                let bodyData = '';
                const payload = msg.data.payload;
                if (payload.parts) {
                    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
                    if (textPart && textPart.body.data) {
                        bodyData = Buffer.from(textPart.body.data, 'base64').toString('utf8');
                    }
                } else if (payload.body && payload.body.data) {
                    bodyData = Buffer.from(payload.body.data, 'base64').toString('utf8');
                }

                // Greenhouse codes are 6-digits
                const codeMatch = bodyData.match(/\b(\d{6})\b/);
                if (codeMatch) {
                    console.log(`✅ Extracted 2FA Code: ${codeMatch[1]}`);
                    return codeMatch[1];
                }
            }
        } catch (err) {
            console.error('Gmail API Error: ' + err);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return null;
}

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Choose a random job to test
    const testUrl = "https://job-boards.greenhouse.io/appliedintuition/jobs/4678157005";
    
    console.log(`Navigating to ${testUrl}...`);
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log("Auto-filling form...");
    await populateGreenhouse(page, testUrl, "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260420-staff-mle\\resume-dhl-20260420-staff-mle.pdf", {}, true);
    
    console.log("\n==============================================");
    console.log("🛑 APPLICATION FILLED BUT NOT SUBMITTED 🛑");
    console.log("Please manually click 'Submit Application' in the browser window.");
    console.log("If a 2FA Verification popup appears, do not touch it!");
    console.log("Waiting for the popup to detect 2FA requirement...");
    console.log("==============================================\n");

    // Wait for the 2FA input field to appear
    try {
        const firstDigitInput = page.locator('input[data-automation-id="verification-code-input-0"]').first();
        await firstDigitInput.waitFor({ state: 'visible', timeout: 60000 });
        console.log("2FA Challenge Detected!");

        const code = await getLatestGreenhouseCode();
        if (code) {
            console.log("Injecting code into the UI...");
            for (let i = 0; i < 6; i++) {
                const input = page.locator(`input[data-automation-id="verification-code-input-${i}"]`).first();
                await input.fill(code[i]);
                await page.waitForTimeout(50);
            }
            
            console.log("Submitting verification...");
            const verifyButton = page.locator('button[data-automation-id="verify-button"]').first();
            await verifyButton.click();
            console.log("✅ 2FA Verification Complete!");
        } else {
            console.log("❌ Timed out waiting for the code email.");
        }
    } catch(e) {
        console.log("No 2FA challenge appeared within 60 seconds, or submission succeeded without it.");
    }

    console.log("Test script complete. Leaving browser open for your inspection.");
})();
