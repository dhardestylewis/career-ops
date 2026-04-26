import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(stealthPlugin());
import { pathToFileURL } from 'url';

// Dynamically extract Profile configuration
let profileConfig = {};
try {
    const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
    profileConfig = yaml.load(fileContents);
} catch (e) {
    console.log("⚠️ Could not load profile.yml");
}

// Identify targeted Job Endpoints from batch-input.tsv dynamically
const rawBatch = fs.readFileSync('batch/batch-input.tsv', 'utf8').split('\n');
const leverUrls = [];
const greenhouseUrls = [];
const ashbyUrls = [];

// [SAFEGUARD] Global ATS Rate Limit tracking
const MAX_APPS_PER_COMPANY = profileConfig?.execution?.max_apps_per_company || 3;

// History-Aware Parsing: Load historical limits from applications.md within a 60-day window
let companyLimits = {};
try {
    const appsMd = fs.readFileSync('data/applications.md', 'utf8');
    const lines = appsMd.split('\n');
    const now = new Date();
    for (const line of lines) {
        if (!line.startsWith('|') || line.includes('---') || line.includes('Date')) continue;
        const cols = line.split('|').map(c => c.trim());
        if (cols.length >= 4) {
            const dateStr = cols[2];
            const company = cols[3].toLowerCase();
            const date = new Date(dateStr);
            if (!isNaN(date)) {
                const diffTime = Math.abs(now - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 60) {
                    if (!companyLimits[company]) companyLimits[company] = 0;
                    companyLimits[company]++;
                }
            }
        }
    }
} catch(e) {}

for (let i = 1; i < rawBatch.length; i++) {
    const line = rawBatch[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    
    // Check Safeguard Limit
    if (parts.length >= 3) {
        const company = parts[2].trim().toLowerCase();
        if (company) {
            if (!companyLimits[company]) companyLimits[company] = 0;
            if (companyLimits[company] >= MAX_APPS_PER_COMPANY) {
                console.log(`⚠️ [SAFEGUARD] Dropping ${parts[1].trim()} - Max limit (${MAX_APPS_PER_COMPANY}) reached for ${company}`);
                continue; // Skip queuing this endpoint
            }
            companyLimits[company]++;
        }
    }

    const rawUrl = parts[1].trim();
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
    ...shuffle(leverUrls).map(url => ({ url, type: 'lever' })),
    ...shuffle(greenhouseUrls).map(url => ({ url, type: 'greenhouse' })),
    ...shuffle(ashbyUrls).map(url => ({ url, type: 'ashby' }))
];

const resumePath = "C:\\Users\\dhl\\data\\Portfolio\\cv-dhl.git\\resume\\2-page\\without-cover-letter\\resume-dhl-20260420-staff-mle\\resume-dhl-20260420-staff-mle.pdf";

// Limit the run to 50 randomly selected endpoints to prevent memory exhaustion
const RUN_LIMIT = targets.length;
const selectedTargets = targets.slice(0, RUN_LIMIT);

console.log(`Starting headless multi-tab validation over ${selectedTargets.length} queued endpoints (from total ${targets.length})...`);

(async () => {
    const statsStore = [];
    
    // Concurrent Multi-Tab Execution (Batching 5 tabs per unified Chromium Window)
    const chunkSize = 5;
    
    console.log(`Launching Unified Persistent Chrome Context from ${profileConfig.execution?.chrome_profilePath || 'data/chrome-bot-profile'}`);
    const launchArgs = ['--disable-blink-features=AutomationControlled']; // Hide headless properties natively
    const audioPath = path.resolve('data/pronunciation.wav');
    if (fs.existsSync(audioPath)) {
        launchArgs.push('--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${audioPath}`);
    }

    const context = await chromium.launchPersistentContext(profileConfig.execution?.chrome_profilePath || 'data/chrome-bot-profile', { 
        headless: false, 
        args: launchArgs,
        ignoreDefaultArgs: ["--enable-automation"],
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
        
        // --- WAF VISIBILITY SPOOFING ---
        // Prevent WAFs from detecting concurrent background tab execution.
        // If a WAF sees 80 WPM typing on a tab with visibilityState === 'hidden', it flags it as a bot instantly.
        Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
        Object.defineProperty(document, 'hidden', { get: () => false });
        Object.defineProperty(document, 'hasFocus', { value: () => true });
    });

    for (let i = 0; i < selectedTargets.length; i += chunkSize) {
        const chunk = selectedTargets.slice(i, i + chunkSize);
        console.log(`\nDispatching multi-tab concurrent rendering chunk [${i + 1} to ${i + chunk.length} of ${targets.length}]...`);
        
        const chunkPromises = chunk.map(async (target) => {
            const { url, type } = target;
            const page = await context.newPage();
            try {
                let metrics;
                if (type === 'lever') {
                    const moduleUrl = `${pathToFileURL(path.resolve('src/scrapers/auto-fill-lever.mjs')).href}?cacheBust=${Date.now()}`;
                    const { populateLever } = await import(moduleUrl);
                    metrics = await populateLever(page, url, resumePath, profileConfig, true);
                } else if (type === 'greenhouse') {
                    const moduleUrl = `${pathToFileURL(path.resolve('src/scrapers/auto-fill-greenhouse.mjs')).href}?cacheBust=${Date.now()}`;
                    const { populateGreenhouse } = await import(moduleUrl);
                    metrics = await populateGreenhouse(page, url, resumePath, profileConfig, true, true);
                } else if (type === 'ashby') {
                    const moduleUrl = `${pathToFileURL(path.resolve('src/scrapers/auto-fill-ashby.mjs')).href}?cacheBust=${Date.now()}`;
                    const { populateAshby } = await import(moduleUrl);
                    metrics = await populateAshby(page, url, resumePath, profileConfig, true);
                }
                
                console.log(`[${type}] ✅ Fill Rate: ${metrics.fillPercentage}% (${metrics.filled}/${metrics.total} fields) on ${url} -> ${metrics.status}`);
                if (process.env.DEBUG_MODE !== 'true') { await page.close(); }
                return { url, status: metrics.status || 'Success', ...metrics };
            } catch (error) {
                console.log(`[${type}] ❌ Script Error/Crash on ${url}:\n`, error);
                if (process.env.DEBUG_MODE !== 'true') { await page.close(); }
                return { url, status: 'Submission_Exception', fillPercentage: 0 };
            }
        });

        // Resolve 5 background tabs concurrently
        const completedChunk = await Promise.all(chunkPromises);
        statsStore.push(...completedChunk);

        // Dynamically flush metrics to disk after every chunk completes!
        let markdown = "# Concurrent Multi-Tab Telemetry Report\n\n| URL | Fill Rate | Found | Filled | Status | Unmapped DOM (Misses) |\n|---|---|---|---|---|---|\n";
        const missingDOMData = {};
        if (!fs.existsSync('logs/snapshots')) fs.mkdirSync('logs/snapshots', { recursive: true });

        for (const stat of statsStore) {
            const unmappedCount = stat.missingDOM ? stat.missingDOM.length : 0;
            markdown += `| ${stat.url.substring(0, 45)}... | ${stat.fillPercentage || 0}% | ${stat.total || 0} | ${stat.filled || 0} | ${stat.status} | ${unmappedCount} |\n`;
            if (stat.missingDOM && stat.missingDOM.length > 0) {
                missingDOMData[stat.url] = stat.missingDOM;
            }
            if (stat.snapshot) {
                const domain = stat.domain || 'unknown';
                const jobId = (new URL(stat.url).pathname.split('/').pop() || Date.now()) + (new URL(stat.url).searchParams.get('gh_jid') || '');
                const cleanJobId = jobId.replace(/[^a-zA-Z0-9]/g, '');
                fs.writeFileSync(`logs/snapshots/${domain}_${cleanJobId}.json`, JSON.stringify(stat.snapshot, null, 2));
                if (stat.rawFormHtml) fs.writeFileSync(`logs/snapshots/${domain}_${cleanJobId}_DOM.html`, stat.rawFormHtml);
            }
        }
        if (!fs.existsSync('logs')) fs.mkdirSync('logs');
        if (!fs.existsSync('logs/runs')) fs.mkdirSync('logs/runs');
        
        // Save the permanent timestamped markdown log
        const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFileSync(`logs/runs/evaluation_stats_run_${runTimestamp}.md`, markdown);
        
        // Also update the convenience pointer
        fs.writeFileSync('logs/evaluation_stats_run_latest.md', markdown);
        
        fs.writeFileSync('logs/missing_dom.json', JSON.stringify(missingDOMData, null, 2));

        // Append to persistent time-series tracker
        const trackerFile = 'logs/fill_rate_tracker.tsv';
        if (!fs.existsSync(trackerFile)) {
            fs.writeFileSync(trackerFile, 'Timestamp\tGitHash\tDomain\tURL\tFillPercentage\tFilled\tTotal\tUnmapped\n');
        }
        const timestamp = new Date().toISOString();
        let gitHash = 'unknown';
        try {
            gitHash = require('child_process').execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch(e) {}
        let trackerData = '';
        for (const stat of statsStore) {
            const domain = stat.domain || (stat.url.includes('greenhouse.io') || stat.url.includes('gh_jid') ? 'greenhouse' : 'unknown');
            const unmappedCount = stat.missingDOM ? stat.missingDOM.length : 0;
            trackerData += `${timestamp}\t${gitHash}\t${domain}\t${stat.url}\t${stat.fillPercentage || 0}\t${stat.filled || 0}\t${stat.total || 0}\t${unmappedCount}\n`;
        }
        fs.appendFileSync(trackerFile, trackerData);
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



