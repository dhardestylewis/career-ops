import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { chromium } from 'playwright';

import { populateLever } from './auto-fill-lever.mjs';
import { populateGreenhouse } from './auto-fill-greenhouse.mjs';
import { populateAshby } from './auto-fill-ashby.mjs';

// Dynamically extract Profile configuration
let profileConfig = {};
try {
    const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
    profileConfig = yaml.load(fileContents);
} catch (e) {
    console.log("⚠️ Could not load profile.yml");
}

// Identify targeted Job Endpoints from pipeline.md dynamically
const rawPipeline = fs.readFileSync('data/pipeline.md', 'utf8').split('\n');
const leverUrls = [];
const greenhouseUrls = [];
const ashbyUrls = [];
for (const line of rawPipeline) {
    if (!line.includes('- [ ]')) continue;
    const rawUrl = line.substring(line.indexOf('[ ]') + 3).split('|')[0].trim();
    const url = rawUrl.split('?')[0]; 
    if (url.includes('lever.co')) leverUrls.push(url);
    if (url.includes('greenhouse.io') || rawUrl.includes('gh_jid=')) greenhouseUrls.push(rawUrl);
    if (url.includes('ashbyhq.com')) ashbyUrls.push(url);
}

// Shuffle arrays for wide dispersion sampling
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Aggregate the massive subset of targets for concurrent Multi-Tab execution
const targets = [
    // ...shuffle(leverUrls).map(url => ({ url, type: 'lever' })),
    ...shuffle(greenhouseUrls).map(url => ({ url, type: 'greenhouse' })),
    // ...shuffle(ashbyUrls).map(url => ({ url, type: 'ashby' }))
];

const resumePath = "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260420-staff-mle\\resume-dhl-20260420-staff-mle.pdf";

console.log(`Starting headless multi-tab validation over ${targets.length} queued endpoints...`);

(async () => {
    const statsStore = [];
    
    // Concurrent Multi-Tab Execution (Batching 5 tabs per unified Chromium Window)
    const chunkSize = 5;
    
    console.log(`Launching Unified Persistent Chrome Context from ${profileConfig.execution?.chrome_profilePath || 'data/chrome-bot-profile'}`);
    const launchArgs = []; // Removed off-screen positioning so it launches visibly by default
    const audioPath = path.resolve('data/pronunciation.wav');
    if (fs.existsSync(audioPath)) {
        launchArgs.push('--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${audioPath}`);
    }

    const context = await chromium.launchPersistentContext(profileConfig.execution?.chrome_profilePath || 'data/chrome-bot-profile', { 
        headless: false, 
        args: launchArgs,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    console.log("\n==================================");
    console.log("⌨️  PRESS [ENTER] AT ANY TIME TO PULL THE BROWSER ON SCREEN");
    console.log("==================================\n");

    process.stdin.once('data', async () => {
        try {
            console.log("\n[CDP] Intercepting Window State... Moving bounds on screen!");
            const page = context.pages()[0] || await context.newPage();
            const session = await context.newCDPSession(page);
            const { windowId } = await session.send('Browser.getWindowForTarget');
            await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'maximized' } });
            console.log("✅ Window maximized.");
        } catch(e) {
            console.log("⚠️ Could not invoke CDP bindings: " + e.message);
        }
    });

    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        window.navigator.chrome = { runtime: {} };
    });

    for (let i = 0; i < targets.length; i += chunkSize) {
        const chunk = targets.slice(i, i + chunkSize);
        console.log(`\nDispatching multi-tab concurrent rendering chunk [${i + 1} to ${i + chunk.length} of ${targets.length}]...`);
        
        const chunkPromises = chunk.map(async (target) => {
            const { url, type } = target;
            const page = await context.newPage();
            try {
                let metrics;
                if (type === 'lever') {
                    metrics = await populateLever(page, url, resumePath, profileConfig, true);
                } else if (type === 'greenhouse') {
                    metrics = await populateGreenhouse(page, url, resumePath, profileConfig, true);
                } else if (type === 'ashby') {
                    metrics = await populateAshby(page, url, resumePath, profileConfig, true);
                }
                
                console.log(`[${type}] ✅ Fill Rate: ${metrics.fillPercentage}% (${metrics.filled}/${metrics.total} fields) on ${url} -> ${metrics.status}`);
                if (metrics.status !== 'Success_Unverified' && metrics.status !== 'Success') {
                    // await page.close(); // Temporarily disabled: keep all executed tabs alive
                } else {
                    console.log(`⚠️ Keeping ${url} tab alive for potential CAPTCHA verification.`);
                }
                return { url, status: metrics.status || 'Success', ...metrics };
            } catch (error) {
                console.log(`[${type}] ❌ Script Error/Crash on ${url}`);
                // await page.close(); // Temporarily disabled to prevent losing CAPTCHA tabs that errantly throw
                return { url, status: 'Error', fillPercentage: 0 };
            }
        });

        // Resolve 5 background tabs concurrently
        const completedChunk = await Promise.all(chunkPromises);
        statsStore.push(...completedChunk);

        // Dynamically flush metrics to disk after every chunk completes!
        let markdown = "# Concurrent Multi-Tab Telemetry Report\n\n| URL | Fill Rate | Found | Filled | Status |\n|---|---|---|---|---|\n";
        const missingDOMData = {};
        for (const stat of statsStore) {
            markdown += `| ${stat.url.substring(0, 45)}... | ${stat.fillPercentage || 0}% | ${stat.total || 0} | ${stat.filled || 0} | ${stat.status} |\n`;
            if (stat.missingDOM && stat.missingDOM.length > 0) {
                missingDOMData[stat.url] = stat.missingDOM;
            }
        }
        fs.writeFileSync('evaluation_stats_run.md', markdown);
        fs.writeFileSync('missing_dom.json', JSON.stringify(missingDOMData, null, 2));
    }
    
    console.log("\n==================================");
    console.log("Concurrent Massive Queue Execution Complete.");
    
    const needsCaptcha = statsStore.some(s => s.status === 'Success_Unverified' || s.status === 'Success');
    if (needsCaptcha) {
        console.log("\n⚠️ [ACTION REQUIRED] Browser context left open. Press ENTER to pull browser to screen and solve any pending CAPTCHAs on the open tabs.");
        // We do not await context.close() here, the process stays alive
        await new Promise(() => {}); 
    } else {
        await context.close();
    }

    console.log("Pipeline finalized.");
    process.exit(0);
})();



