/**
 * Single-URL focused runner for manual CAPTCHA resolution.
 * Run: node run-single.mjs
 * Then press ENTER when you see a CAPTCHA to pull the browser on screen.
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { populateLever } from '../scrapers/auto-fill-lever.mjs';

const profileConfig = yaml.load(fs.readFileSync('config/profile.yml', 'utf8'));
const resumePath = "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260420-staff-mle\\resume-dhl-20260420-staff-mle.pdf";
const chromePath = profileConfig?.execution?.chrome_profilePath || './data/chrome-bot-profile';

// ── TARGETS ─────────────────────────────────────────────────────────────────
const targets = [
    'https://jobs.lever.co/mistral/675b7f06-a76b-4144-af0c-4dd3282ef489',
    'https://jobs.lever.co/mistral/c2cf8b02-cb79-4e13-8717-25817813542d',
    'https://jobs.lever.co/spotify/fc593885-54e1-4807-a67c-77c1d3412cec',
    'https://jobs.lever.co/spotify/a95830ad-c11f-49da-85a7-04ce47ce532c',
    'https://jobs.lever.co/spotify/dcf7cb46-c11d-4704-a034-9bfdd64a0aa1',
];
// ────────────────────────────────────────────────────────────────────────────

(async () => {
    const context = await chromium.launchPersistentContext(chromePath, {
        headless: false,
        args: [
            '--window-position=-10000,-10000',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
        ],
        viewport: null,
    });

    console.log("\n==================================");
    console.log("⌨️  PRESS [ENTER] AT ANY TIME TO PULL THE BROWSER ON SCREEN");
    console.log("==================================\n");

    process.stdin.once('data', async () => {
        try {
            const pages = context.pages();
            const page = pages[pages.length - 1] || await context.newPage();
            const session = await context.newCDPSession(page);
            const { windowId } = await session.send('Browser.getWindowForTarget');
            await session.send('Browser.setWindowBounds', { windowId, bounds: { left: 0, top: 0, width: 1440, height: 900, windowState: 'normal' } });
            console.log("✅ Window pulled to screen.");
        } catch(e) {
            console.log("⚠️ CDP error: " + e.message);
        }
    });

    console.log(`\nLaunching all ${targets.length} tabs concurrently...\n`);

    await Promise.all(targets.map(async (url) => {
        const page = await context.newPage();
        try {
            const metrics = await populateLever(page, url, resumePath, profileConfig, true);
            console.log(`\n✅ ${url.split('/').slice(-1)[0]} → ${metrics.fillPercentage}% → ${metrics.status}`);
            // Do NOT close page — leave open for CAPTCHA resolution
        } catch(e) {
            console.log(`\n❌ Error on ${url}: ${e.message}`);
        }
    }));

    console.log("\n==================================\nAll tabs filled and waiting. Press ENTER to bring browser to screen,\nthen click through each tab to solve CAPTCHAs.\n==================================");
    // Keep process alive indefinitely until user manually closes the browser
    await new Promise(() => {});
})();
