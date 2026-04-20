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
        // Greenhouse uses a generic data-source button for attachments, which surfaces a hidden file input when interrogated
        const buttonGroup = page.locator('.resume-submit-group button[data-source="attach"]');
        if (await buttonGroup.count() > 0) {
            await buttonGroup.first().click();
        }
        
        let fileInput = page.locator('input[type="file"][id="resume"]');
        if (await fileInput.count() === 0) fileInput = page.locator('input[type="file"]');
        
        if (await fileInput.count() > 0) {
            await fileInput.first().setInputFiles(path.resolve(resumePath));
            console.log("✅ Resume attached.");
        } else {
            console.log("❌ Could not locate Greenhouse file input structure.");
        }
    } catch (e) {
        console.error("❌ Failed to attach resume automatically.", e.message);
    }

    console.log("Filling standard details...");
    
    const safeFill = async (selector, value) => {
        try {
            const el = page.locator(selector);
            if (await el.count() > 0 && await el.isVisible()) {
                // To avoid triggering CAPTCHAs with 0ms insertions, we focus and sequentially type like a human
                await el.focus();
                await el.pressSequentially(value, { delay: Math.floor(Math.random() * 30) + 15 });
                await page.waitForTimeout(Math.floor(Math.random() * 300) + 100); // Random breath between fields
            }
        } catch (e) {}
    };

    // Greenhouse explicitly separates First/Last name
    await safeFill('#first_name', 'Daniel');
    await safeFill('#last_name', 'Hardesty Lewis');
    await safeFill('#email', 'daniel@homecastr.com');
    await safeFill('#phone', '+1 (713) 371-7875');
    await safeFill('#org', 'Homecastr');

    // Standard Greenhouse URL and generic field mappings
    await safeFill('input[autocomplete="custom-network-linkedin"]', 'https://linkedin.com/in/dhardestylewis');
    await safeFill('input[autocomplete="custom-network-github"]', 'https://github.com/dhardestylewis');
    await safeFill('input[autocomplete="custom-network-portfolio"]', 'https://dlewis.ai');
    
    // Attempt broad catch for LinkedIn if custom tags aren't present
    const linkedinBroad = page.locator('input[type="text"]').filter({ hasText: /linkedin/i });
    if (await linkedinBroad.count() > 0) await linkedinBroad.first().fill('https://linkedin.com/in/dhardestylewis');

    // Autocomplete Location fields (Greenhouse requires actual UI interaction for the auto-select dropdown)
    try {
        const locField = page.locator('#job_application_location');
        if (await locField.count() > 0 && await locField.first().isVisible()) {
            await locField.first().focus();
            await locField.first().fill(""); // Clear first
            await locField.first().pressSequentially('New York, NY', { delay: 50 });
            await page.waitForTimeout(1500); // Wait for the network call to fetch Google Places
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(100);
            await page.keyboard.press('Enter');
        }
    } catch(e) { console.error("Location Field Autocomplete bypassed with fallback."); }

    console.log("Detecting and setting Global Select Dropdowns (Demographics, Visa, Location)...");
    const allSelects = await page.$$('select');
    for (const select of allSelects) {
        try {
            // Read question text robustly using native browser DOM traversal
            const lowerText = await select.evaluate((node) => {
                const container = node.closest('div.field, div.custom-question, label, div');
                return container ? container.textContent.toLowerCase() : '';
            });

            const options = await selectElement.$$eval('option', opts => opts.map(o => o.textContent.trim()));

            let targetValue = null;
            if (lowerText.includes('authorized to work') && lowerText.includes('without sponsorship')) {
                targetValue = 'Yes';
            } else if (lowerText.includes('require sponsorship') || lowerText.includes('need sponsorship')) {
                targetValue = 'No';
            } else if (lowerText.includes('authorized to work')) {
                targetValue = 'Yes';
            } else if (lowerText.includes('past 6 months') || lowerText.includes('previously applied')) {
                targetValue = 'No';
            }

            if (targetValue) {
                const match = options.find(o => o && o.toLowerCase() === targetValue.toLowerCase());
                if (match) {
                     await select.selectOption({ label: match }).catch(async ()=> {
                          // Try raw value check if strict label bounding fails
                          await select.selectOption(match).catch(()=>{});
                     });
                     await page.waitForTimeout(200); // Breath
                }
            }
        } catch(e) {}
    }

    console.log("Waiting for asynchronous form elements to inject...");
    await page.waitForTimeout(2000); // Give JS time to mount dynamic Demographic Questions

    console.log("Filling demographic EEO fields...");
    const safeSelect = async (id, value) => {
        try {
            const el = page.locator(`select[id="${id}"]`);
            if (await el.count() > 0 && await el.isVisible()) {
                const selectElement = await el.elementHandle();
                const options = await selectElement.$$eval('option', opts => opts.map(o => o.textContent));
                const match = options.find(o => o && o.toLowerCase().includes(value.toLowerCase()));
                if (match) {
                    await el.selectOption({ label: match });
                }
            }
        } catch (e) {}
    };

    // Greenhouse uses specific IDs rather than eeoc[] name arrays
    await safeSelect('job_application_gender', 'Male');
    await safeSelect('job_application_race', 'Hispanic or Latino');
    await safeSelect('job_application_veteran_status', 'not a protected veteran');
    await safeSelect('job_application_disability_status', 'Decline to self-identify');

    console.log("Checking for modern React-Select Demographics & Location implementations...");
    const safeReactSelect = async (id, value) => {
        try {
            const locator = page.locator(`input.select__input[id="${id}"]`);
            if (await locator.count() > 0 && await locator.isVisible()) {
                await locator.fill(value);
                await page.waitForTimeout(500); // Wait for React-Select API to asynchronously filter matching options
                await locator.press('Enter');
                await page.waitForTimeout(200);
            }
        } catch(e) {}
    };

    // Modern Greenhouse React-Select Explicit ID Hooks
    await safeReactSelect('gender', 'Male');
    await safeReactSelect('hispanic_ethnicity', 'No');
    await safeReactSelect('veteran_status', 'not a protected veteran');
    await safeReactSelect('disability_status', 'Decline to self-identify');
    await safeReactSelect('country', 'United States');

    console.log("Scanning for Custom ATS questions via Heuristic Engine...");
    try {
        const minComp = profileConfig?.compensation?.target_range || profileConfig?.compensation?.minimum || '$180,000';
        const exitStory = profileConfig?.narrative?.exit_story || 'Client-facing modeling expertise';
        
        // Scan textareas specifically in case block wrappers fail on Greenhouse
        const allTextAreas = await page.$$('textarea');
        for (const area of allTextAreas) {
            try {
                const parentLabel = await area.$('xpath=ancestor::div[contains(@class,"field")] | ancestor::label | preceding-sibling::label');
                const text = parentLabel ? await parentLabel.textContent() : '';
                const lowerText = text ? text.toLowerCase() : '';
                if (lowerText.includes('why') || lowerText.includes('interest') || lowerText.includes('reason') || lowerText.includes('cover letter') || lowerText.includes('achievement') || lowerText.includes('project') || lowerText.includes('hume')) {
                    if (!(await area.inputValue())) await area.fill(exitStory);
                }
            } catch(e) {}
        }
        
        // Scan custom inputs directly reading Aria labels to bypass broken parent DOM hierarchies
        const allInputs = await page.$$('input[type="text"]');
        for (const input of allInputs) {
            try {
                const ariaLabel = (await input.getAttribute('aria-label') || '').toLowerCase();
                
                if (ariaLabel.includes('salary') || ariaLabel.includes('compensation') || ariaLabel.includes('expectations') || ariaLabel.includes('package')) {
                    if (!(await input.inputValue())) await input.fill(minComp.toString());
                } else if (ariaLabel.includes('notice period') || ariaLabel.includes('available to start')) {
                    if (!(await input.inputValue())) await input.fill("2-4 weeks");
                }
            } catch(e) {}
        }
        
        // Scan custom checkboxes specifically using their 'description' tag (like "Where did you hear about us") 
        const allCheckboxes = await page.$$('input[type="checkbox"]');
        let hearAboutFilled = false;
        for (const check of allCheckboxes) {
            try {
                const desc = (await check.getAttribute('description') || '').toLowerCase();
                const ariaL = (await check.getAttribute('aria-label') || '').toLowerCase();
                if ((desc.includes('hear about') || ariaL.includes('hear about')) && !hearAboutFilled) {
                    if (!(await check.isChecked())) await check.check({ force: true });
                    hearAboutFilled = true; // Only fill one option for multiple choice
                }
            } catch(e) {}
        }

        // Handle custom React-Select comboboxes by resolving their aria-labelledby
        const allCombos = await page.$$('input.select__input[role="combobox"]');
        for (const combo of allCombos) {
            try {
                const ariaLabelledBy = await combo.getAttribute('aria-labelledby');
                if (ariaLabelledBy) {
                    // Greenhouse escapes dots and odd characters in dynamic IDs, but mostly pure alphanumeric
                    const labelEl = await page.$(`[id="${ariaLabelledBy}"]`);
                    if (labelEl) {
                        const labelText = ((await labelEl.textContent()) || '').toLowerCase();
                        if (labelText.includes('sponsorship') || labelText.includes('require visa')) {
                             await combo.fill('No');
                             await page.waitForTimeout(300);
                             await combo.press('Enter');
                             await page.waitForTimeout(200);
                        } else if (labelText.includes('authorized to work') || labelText.includes('right to work')) {
                             await combo.fill('Yes');
                             await page.waitForTimeout(300);
                             await combo.press('Enter');
                             await page.waitForTimeout(200);
                        }
                    }
                }
            } catch(e) {}
        }
        
        // Greenhouse wraps all custom fields in <div class="field"> with an internal <label> for text/checkboxes
        const questionBlocks = await page.$$('.field, label, .application-question, .custom-question');
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
                // Try to grab the parent label or container for better context
                const container = el.closest('div.field, .application-question, label') || el;
                missingDOM.push(container.outerHTML.substring(0, 1500)); // cap size to prevent giant payloads
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
