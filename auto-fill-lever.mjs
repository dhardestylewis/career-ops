import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const url = process.argv[2];
const resumePath = process.argv[3];

if (!url || !resumePath) {
    console.error("Usage: node auto-fill-lever.mjs <url> <resume-pdf-path>");
    process.exit(1);
}

if (!fs.existsSync(resumePath)) {
    console.error(`Resume file not found at: ${resumePath}`);
    process.exit(1);
}

// Dynamically extract Profile configuration for the Heuristics Engine
let profileConfig = {};
try {
    const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
    profileConfig = yaml.load(fileContents);
} catch (e) {
    console.log("⚠️ Could not load profile.yml for advanced heuristics.");
}

(async () => {
    // Check if running in headless telemetry batch evaluator
    const isBatch = process.env.BATCH_EVAL_MODE === 'true';
    const browser = await chromium.launch({ headless: false, args: ['--window-position=-10000,-10000'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    // Mask standard automated browser hooks to avoid Captcha triggers
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        window.navigator.chrome = { runtime: {} };
    });

    const page = await context.newPage();

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log("Waiting for form elements to load...");
    await page.waitForSelector('input[name="name"]', { timeout: 10000 }).catch(() => {});

    console.log("Attaching Resume natively...");
    try {
        // Lever usually has an explicit file input for resumes
        const fileInput = page.locator('input[type="file"][name="resume"]');
        if (await fileInput.count() > 0) {
            await fileInput.first().setInputFiles(path.resolve(resumePath));
            console.log("✅ Resume attached.");
        } else {
            console.log("⚠️ Could not locate standard resume file input. Looking for generic file inputs...");
            const genericFileInput = page.locator('input[type="file"]');
            if (await genericFileInput.count() > 0) {
                await genericFileInput.first().setInputFiles(path.resolve(resumePath));
                console.log("✅ Resume attached via generic input.");
            } else {
                console.log("❌ No file inputs found on the page.");
            }
        }
    } catch (e) {
        console.error("❌ Failed to attach resume automatically.", e.message);
    }

    console.log("Filling standard details...");
    
    const safeFill = async (selector, value) => {
        try {
            const el = page.locator(selector);
            if (await el.count() > 0 && await el.isVisible()) {
                await el.focus();
                await el.pressSequentially(value, { delay: Math.floor(Math.random() * 30) + 15 });
                await page.waitForTimeout(Math.floor(Math.random() * 300) + 100);
            }
        } catch (e) {}
    };

    await safeFill('input[name="name"]', 'Daniel Hardesty Lewis');
    await safeFill('input[name="email"]', 'daniel@homecastr.com');
    await safeFill('input[name="phone"]', '+1 (713) 371-7875');
    await safeFill('input[name="org"]', 'Homecastr');

    // Standard Lever URL fields
    await safeFill('input[name="urls[LinkedIn]"]', 'https://linkedin.com/in/dhardestylewis');
    await safeFill('input[name="urls[GitHub]"]', 'https://github.com/dhardestylewis');
    await safeFill('input[name="urls[Portfolio]"]', 'https://dlewis.ai');
    await safeFill('input[name="urls[Other]"]', 'https://homecastr.com');
    await safeFill('input[name="urls[Other website]"]', 'https://homecastr.com');

    console.log("Detecting and setting Location dropdown (to trigger dynamic EEO questions)...");
    const allSelects = await page.$$('select');
    for (const select of allSelects) {
        const options = await select.$$eval('option', opts => opts.map(o => o.textContent));
        const match = options.find(o => o && (o.toLowerCase().includes('united states') || o.toLowerCase().includes('new york')));
        if (match) {
            await select.selectOption({ label: match });
        }
    }

    console.log("Waiting for asynchronous form elements to inject...");
    await page.waitForTimeout(2000); // Give JS time to mount dynamic Demographic Questions

    console.log("Filling demographic EEO fields...");
    const safeSelect = async (name, value) => {
        try {
            const el = page.locator(`select[name="${name}"]`);
            if (await el.count() > 0 && await el.isVisible()) {
                // Try finding by generic partial text matching for max robust ATS mapping
                const selectElement = await el.elementHandle();
                const options = await selectElement.$$eval('option', opts => opts.map(o => o.textContent));
                const match = options.find(o => o && o.toLowerCase().includes(value.toLowerCase()));
                if (match) {
                    await el.selectOption({ label: match });
                }
            }
        } catch (e) {}
    };

    await safeSelect('eeoc[gender]', 'Male');
    await safeSelect('eeoc[race]', 'Hispanic or Latino');
    await safeSelect('eeoc[veteran]', 'not a protected veteran');
    await safeSelect('eeoc[disability]', 'Decline to self-identify');

    // Sponsorship questions are often custom radio fields on Lever. We attempt a safe check for common formulations
    // of the work auth and sponsorship questions using generic label clicks if they exist.
    try {
        const labels = await page.$$('label');
        for (const label of labels) {
            const text = await label.textContent();
            const lowerText = text.toLowerCase();
            
            // Work Authorization (Yes)
            if (lowerText.includes('authorized to work') && !lowerText.includes('sponsorship')) {
                const yesInput = await label.$('xpath=..//input[@type="radio" and translate(@value,"YES","yes")="yes" or following-sibling::text()[contains(translate(.,"YES","yes"), "yes")]]');
                if (yesInput) await yesInput.check();
            }
            
            // Sponsorship (No)
            if (lowerText.includes('sponsorship') || lowerText.includes('require sponsorship')) {
                const noInput = await label.$('xpath=..//input[@type="radio" and translate(@value,"NO","no")="no" or following-sibling::text()[contains(translate(.,"NO","no"), "no")]]');
                if (noInput) await noInput.check();
            }
        }
    } catch(e) {}

    console.log("Scanning for Custom ATS questions via Heuristic Engine...");
    try {
        const minComp = profileConfig?.compensation?.target_range || profileConfig?.compensation?.minimum || '$180,000';
        const exitStory = profileConfig?.narrative?.exit_story || 'Software engineering leader.';
        
        const questionBlocks = await page.$$('.application-question, label');
        for (const block of questionBlocks) {
            const lowerText = (await block.textContent()).toLowerCase();

            // Ignore standard fields
            if (lowerText.includes('resume') || lowerText.includes('cv') || lowerText.includes('name') || lowerText.includes('email') || lowerText.includes('phone') || lowerText.includes('company')) {
                continue;
            }

            // Heuristic 1: Privacy / Consent / Notice / Future Opportunities Checkboxes
            if (lowerText.includes('privacy') || lowerText.includes('consent') || lowerText.includes('future') || lowerText.includes('acknowledge') || lowerText.includes('agree') || lowerText.includes('terms')) {
                const check = await block.$('input[type="checkbox"]');
                if (check && !(await check.isChecked())) await check.check({ force: true }).catch(()=>{});
            }

            // Heuristic 2: Compensation / Salary Target
            if (lowerText.includes('salary') || lowerText.includes('compensation') || lowerText.includes('expectations')) {
                const txt = await block.$('input[type="text"], textarea');
                if (txt && !(await txt.inputValue())) await txt.fill(minComp.toString());
            }

            // Heuristic 3: Cover Letter analogues / Why us / Interest / Achievements / Projects
            if (lowerText.includes('why') || lowerText.includes('interest') || lowerText.includes('reason') || lowerText.includes('cover letter') || lowerText.includes('achievement') || lowerText.includes('project') || lowerText.includes('visa')) {
                const area = await block.$('textarea');
                if (area && !(await area.inputValue())) await area.fill(exitStory);
            }

            // Heuristic 4: Clearance 
            if (lowerText.includes('clearance')) {
                const t = await block.$('input[type="text"]');
                if (t && !(await t.inputValue())) await t.fill("None");
            }
        }
        
        // Custom Radio Buttons for dynamically injected Generic EEO structures (Spotify / EU forms)
        try {
            const checkExactRadio = async (textLabel) => {
                try {
                    const label = page.getByText(textLabel, { exact: true });
                    if (await label.count() > 0) {
                        const input = label.locator('xpath=..//input | .//input | preceding-sibling::input | following-sibling::input');
                        if (await input.count() > 0) await input.first().check({ force: true });
                        else await label.first().click({ force: true });
                    }
                } catch(e) {}
            };

            const checkFuzzyRadio = async (textLabel) => {
                try {
                    const input = page.locator(`xpath=//label[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "${textLabel.toLowerCase()}")]//input`);
                    if (await input.count() > 0) await input.first().check({ force: true }).catch(()=>{});
                } catch(e) {}
            };

            const gender = profileConfig?.eeo_demographics?.gender?.toLowerCase() || '';
            if (gender === 'male' || gender === 'm' || gender.includes('man') && !gender.includes('woman')) {
                await checkExactRadio('He/him');
                await checkExactRadio('Man');
            }
            
            if (gender === 'female' || gender === 'f' || gender.includes('woman')) {
                await checkExactRadio('She/her');
                await checkExactRadio('Woman');
            }
            
            // Catch custom Visa / Remote arrangement questions 
            await checkFuzzyRadio('live outside');
            await checkFuzzyRadio('do not want to relocate');
            
            const race = profileConfig?.eeo_demographics?.race?.toLowerCase() || '';
            if (race.includes('hispanic')) {
                await checkExactRadio('Hispanic or Latino');
            }
            
            const veteran = profileConfig?.eeo_demographics?.veteran?.toLowerCase() || '';
            if (veteran.includes('not a protected')) {
                // Safely handle literal 'No' 
                const noLabels = await page.$$('label:has-text("No")');
                for (let l of noLabels) await l.click({force:true}).catch(()=>{});
            }
        } catch(e) {}
        
        // Pronouns (often explicitly rendered as standalone labels)
        try {
            const gender = profileConfig?.eeo_demographics?.gender?.toLowerCase() || '';
            if (gender.includes('male')) {
                const heHimLabel = page.getByText('He/him', { exact: false });
                if (await heHimLabel.count() > 0 && await heHimLabel.first().isVisible()) {
                    await heHimLabel.first().click();
                }
            } else if (gender.includes('female')) {
                const sheHerLabel = page.getByText('She/her', { exact: false });
                if (await sheHerLabel.count() > 0 && await sheHerLabel.first().isVisible()) {
                    await sheHerLabel.first().click();
                }
            }
        } catch(e) {}
    } catch(e) {}

    // -------------------------------------------------------------------------
    // BATCH EVALUATION TELEMETRY DOM HOOK
    // -------------------------------------------------------------------------
    // Validate DOM Telemetry immediately before taking any further action so it doesn't get cleared
    console.log("Analyzing form fill completion metrics...");
    await page.waitForTimeout(5000); 

    const metrics = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]), textarea, select'));
        const total = inputs.length;
        let filled = 0;
        const missingDOM = [];
        
        for (const el of inputs) {
            let isFilled = false;
            if (el.tagName === 'SELECT') {
                if (el.selectedIndex > 0 || (el.value && el.value !== "" && el.value !== "0")) isFilled = true;
            } else if (el.type === 'checkbox' || el.type === 'radio') {
                if (el.type === 'radio' && el.name) {
                   const group = document.querySelectorAll(`input[name="${el.name}"]`);
                   if (Array.from(group).some(r => r.checked)) isFilled = true;
                } else if (el.checked) {
                   isFilled = true;
                }
            } else if (el.value && el.value.length > 0) {
                isFilled = true;
            }
            
            if (isFilled) {
                filled++;
            } else {
                const container = el.closest('div.field, .application-question, label') || el;
                missingDOM.push(container.outerHTML.substring(0, 1500));
            }
        }
        
        return { total, filled, fillPercentage: total > 0 ? Math.round((filled / total) * 100) : 0, missingDOM };
    });

    if (isBatch) {
        console.log(`__TELEMETRY__${JSON.stringify(metrics)}__TELEMETRY__`);
    } else {
        console.log("-------------------------------------------------");
        console.log("🎉 Form populated! Passing control over to you.");
        console.log("The browser is now paused. Please review the form,");
        console.log("finish any unhandled demographic/custom questions,");
        console.log("and click the SUBMIT button natively.");
        console.log("When you close the browser window, this script will exit.");
        console.log("-------------------------------------------------");

        // Pause execution to hand off the live browser to the user
        await page.pause();
    }

    await browser.close();
})();
