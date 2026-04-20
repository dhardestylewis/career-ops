import fs from 'fs';
import { fileURLToPath } from 'url';

const files = [
    { file: 'auto-fill-lever.mjs', funcName: 'populateLever' },
    { file: 'auto-fill-greenhouse.mjs', funcName: 'populateGreenhouse' },
    { file: 'auto-fill-ashby.mjs', funcName: 'populateAshby' }
];

for (const { file, funcName } of files) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Replace the top `(async () => {` block
    const asyncStartMatch = content.match(/\(async \(\) => \{\n/);
    if (!asyncStartMatch) {
       console.log(`Skipping ${file}, async IIFE not found.`);
       continue;
    }

    const startIdx = asyncStartMatch.index;
    
    // Find the end of playwright launch block: `const page = await context.newPage();`
    const pageInitIdx = content.indexOf('const page = await context.newPage();');
    
    if (pageInitIdx === -1) {
        console.log(`Could not find context.newPage() in ${file}`);
        continue;
    }
    
    const pageInitEndIdx = content.indexOf('\n', pageInitIdx) + 1;

    // We will slice out the entire block from `(async () => {` down to `const page = await context.newPage();\n`
    // and replace it with our function signature.
    
    // BUT we need to parse if `process.env.BATCH_EVAL_MODE` was declared inside. Instead we pass `isBatch` natively.

    const newSignature = `export async function ${funcName}(page, targetUrl, resumePath, profileConfig, isBatch = false) {\n    const url = targetUrl;\n`;
    
    let topReplaced = content.substring(0, startIdx) + newSignature + content.substring(pageInitEndIdx);

    // 2. Replace the bottom execution block:
    // `    await browser.close();\n})();`
    const bottomMatch = topReplaced.match(/    await browser\.close\(\);\n\}\)\(\);/m);
    
    if (!bottomMatch) {
        // Look for any `})();`
        const fallbackMatch = topReplaced.lastIndexOf('})();');
        if (fallbackMatch !== -1) {
            topReplaced = topReplaced.substring(0, fallbackMatch) + '}\n' + topReplaced.substring(fallbackMatch + 5);
        }
    } else {
        // Strip the `await browser.close();\n})();`
        topReplaced = topReplaced.substring(0, bottomMatch.index) + '}\n' + topReplaced.substring(bottomMatch.index + bottomMatch[0].length);
    }
    
    // We also must find any lingering `browser.close();` inside the body (not just at the end), and remove it since it's managed centrally!
    // Or we leave it because the function no longer closes the browser, simply returns `metrics`.
    topReplaced = topReplaced.replace(/await browser\.close\(\);/g, '');
    
    // 3. Inject the fallback CLI logic at the very bottom
    const cliFallback = `
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    (async () => {
        const isBatch = process.env.BATCH_EVAL_MODE === 'true';
        const targetUrl = process.argv[2];
        const targetResumeUrl = process.argv[3];
        
        const launchArgs = ['--window-position=-10000,-10000'];
        const context = await chromium.launchPersistentContext(profileConfig.execution.chrome_profilePath, { 
            headless: false, 
            args: launchArgs,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.navigator.chrome = { runtime: {} };
        });

        const page = await context.newPage();
        
        try {
            await ${funcName}(page, targetUrl, targetResumeUrl, profileConfig, isBatch);
        } catch (e) {
            console.error(e);
        }
        
        // Let the unified handler deal with cleanup, but for CLI we kill here:
        if (isBatch) {
            await context.close();
        }
    })();
}
`;

    topReplaced += cliFallback;
    
    // Replace `const url = process.argv[2];` and `const resumePath = process.argv[3];` references scattered!
    topReplaced = topReplaced.replace(/const url = process\.argv\[2\];.*/g, '');
    topReplaced = topReplaced.replace(/const resumePath = process\.argv\[3\].*/g, '');

    fs.writeFileSync(file, topReplaced, 'utf8');
    console.log(`Refactored ${file}`);
}


