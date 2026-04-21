import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://jobs.lever.co/palantir/c62264f5-5da8-40fe-9b44-f7f0f0012e11/apply', { waitUntil: 'networkidle' });
    
    // Dump all input elements
    const inputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            className: input.className
        }));
    });
    console.log("All input elements on the page:");
    console.log(inputs);

    // Look for anything near resume or cv
    const resumeText = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label, div, span')).filter(el => 
            el.textContent.toLowerCase().includes('resume') || el.textContent.toLowerCase().includes('cv'));
        return labels.map(l => l.outerHTML.substring(0, 500));
    });
    
    fs.writeFileSync('lever_dom_dump.json', JSON.stringify({ inputs, resumeText }, null, 2));
    console.log("Dumped to lever_dom_dump.json");
    
    await browser.close();
})();
