import { populateLever } from './scrapers/auto-fill-lever.mjs';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
const profileConfig = yaml.load(fileContents);

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    const resumePath = path.resolve('resume.pdf'); // dummy path, auto-fill-lever has try/catch for it
    await populateLever(page, 'https://jobs.lever.co/spotify/b918d247-38fd-449a-b82d-ea1d7c90a099', resumePath, profileConfig, false, true);
    console.log("Lever population completed.");
    await browser.close();
})();
