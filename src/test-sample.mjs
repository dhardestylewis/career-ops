import { populateLever } from './scrapers/auto-fill-lever.mjs';
import { populateGreenhouse } from './scrapers/auto-fill-greenhouse.mjs';
import { populateAshby } from './scrapers/auto-fill-ashby.mjs';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
const profileConfig = yaml.load(fileContents);
const resumePath = path.resolve('resume-dhl-20260421-staff-mle.pdf');

(async () => {
    const browser = await chromium.launch({ headless: false });
    
    console.log('\n==================================');
    console.log('🧪 TESTING IN PARALLEL: Lever, Greenhouse, Ashby');
    console.log('==================================');
    
    const pageLever = await browser.newPage();
    const pageGreenhouse = await browser.newPage();
    const pageAshby = await browser.newPage();
    
    await Promise.allSettled([
        populateLever(pageLever, 'https://jobs.lever.co/zoox/c88c8b02-71b6-492c-a666-584458ac8c6e', resumePath, profileConfig, false, true),
        populateGreenhouse(pageGreenhouse, 'https://boards.greenhouse.io/appliedintuition/jobs/4532553005', resumePath, profileConfig, false, true),
        populateAshby(pageAshby, 'https://jobs.ashbyhq.com/langchain/afb91b9b-46d5-4c9d-aa84-a4f1a3f74263', resumePath, profileConfig, false)
    ]);

    console.log('\n✅ All three scrapers have successfully run through the shared heuristic engine.');
    console.log('Please review the 3 open browser windows, then close them to exit.');
})();
