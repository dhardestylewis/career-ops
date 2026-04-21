import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Use a known working Greenhouse listing from batch run
    await page.goto('https://job-boards.greenhouse.io/gleanwork/jobs/4512895005', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    // Navigate directly to application URL pattern
    const applyBtn = page.locator('a[href*="apply"]').first();
    if (await applyBtn.count() > 0) {
        const href = await applyBtn.getAttribute('href');
        console.log('Apply href:', href);
        if (href) await page.goto(href.startsWith('http') ? href : 'https://job-boards.greenhouse.io' + href, { waitUntil: 'load' });
        await page.waitForTimeout(3000);
    }
    console.log('Form URL:', page.url());

    const dump = await page.evaluate(() => {
        // All inputs
        const inputs = Array.from(document.querySelectorAll('input')).map(el => ({
            type: el.type, name: el.name, id: el.id, className: el.className.substring(0, 80)
        }));
        // Buttons near resume/cover letter
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map(el => ({
            text: el.textContent.trim().substring(0, 60),
            className: el.className.substring(0, 80),
            dataAttrs: Object.fromEntries(Array.from(el.attributes).filter(a => a.name.startsWith('data')).map(a => [a.name, a.value]))
        }));
        // Selects and custom dropdowns
        const selects = Array.from(document.querySelectorAll('select')).map(el => ({
            name: el.name, id: el.id,
            options: Array.from(el.options).map(o => o.text).slice(0, 5)
        }));
        // Labels to understand field names
        const labels = Array.from(document.querySelectorAll('label')).map(el => ({
            for: el.htmlFor, text: el.textContent.trim().substring(0, 60)
        }));
        return { inputs, buttons, selects, labels };
    });

    fs.writeFileSync('greenhouse_dom_dump.json', JSON.stringify(dump, null, 2));
    console.log(`Inputs: ${dump.inputs.length}, Buttons: ${dump.buttons.length}, Selects: ${dump.selects.length}, Labels: ${dump.labels.length}`);
    console.log('File inputs:', dump.inputs.filter(i => i.type === 'file'));
    await browser.close();
})();
