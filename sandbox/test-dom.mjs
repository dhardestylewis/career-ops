import { chromium } from 'playwright';

(async () => {
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.goto('https://jobs.ashbyhq.com/sierra/034c2c56-357f-4ed2-9da7-f4d36a999385/application');
    await p.waitForTimeout(3000);
    const inputs = await p.$$('input[type="file"]');
    console.log('Ashby File inputs:', inputs.length);
    
    await p.goto('https://jobs.lever.co/palantir/c62264f5-5da8-40fe-9b44-f7f0f0012e11');
    await p.waitForTimeout(3000);
    const leverInputs = await p.$$('input[type="file"]');
    console.log('Lever File inputs:', leverInputs.length);

    await b.close();
})();
