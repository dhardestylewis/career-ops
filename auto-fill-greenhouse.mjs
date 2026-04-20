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
    
    // Inject Virtual Microphone for Web Recorders (if config file exists)
    const launchArgs = ['--window-position=-10000,-10000'];
    const audioPath = path.resolve('data/pronunciation.wav');
    if (fs.existsSync(audioPath)) {
        launchArgs.push('--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${audioPath}`);
    }
    
    const browser = await chromium.launch({ headless: false, args: launchArgs });
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
    await page.waitForSelector('#first_name', { timeout: 10000 }).catch(() => {});

    console.log("Extracting Job Description context for Synthesizer...");
    try {
        const jdContainer = await page.locator('#header, #content');
        if (await jdContainer.count() > 0) {
            let shouldGenerate = true;
            if (profileConfig?.execution?.cover_letters === "required_only") {
                const clInputs = page.locator('input[type="file"][name*="cover"], input[type="file"][name*="comment"]');
                let isReq = false;
                if (await clInputs.count() > 0) {
                    isReq = await clInputs.first().evaluate(el => {
                        if (el.required || el.getAttribute('aria-required') === 'true') return true;
                        let p = el;
                        for(let i=0; i<4; i++) {
                            if(!p) break;
                            if (p.classList && p.classList.contains('required')) return true;
                            if (p.textContent && p.textContent.includes('*')) return true;
                            p = p.parentElement;
                        }
                        return false;
                    });
                }
                if (!isReq) shouldGenerate = false;
            }
            
            // Extract unresolved textareas and standard inputs for Dynamic QA
            try {
                let unresolved = [];
                const areas = await page.$$('textarea, input[type="text"], input[type="number"], input[type="url"]');
                for (const area of areas) {
                    const ctx = await page.evaluateHandle(el => el.closest('.application-question, label, div.field') || el.parentElement, area);
                    const labelText = ctx ? await ctx.textContent() : '';
                    
                    const isStandard = await area.evaluate((el, text) => {
                         const n = (el.getAttribute('name') || '').toLowerCase();
                         const id = (el.getAttribute('id') || '').toLowerCase();
                         const p = (el.getAttribute('placeholder') || '').toLowerCase();
                         const v = [n, id, p, text.toLowerCase()].join(' ');
                         const skips = ['first name', 'last name', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'website', 'url', 'cover letter', 'resume', 'password', 'location', 'city', 'address', 'company'];
                         for (const s of skips) if (v.includes(s)) return true;
                         if (el.getAttribute('type') === 'hidden') return true;
                         return false;
                    }, labelText);

                    if (isStandard) continue;

                    const id = await area.getAttribute('id') || await area.getAttribute('name') || '';
                    if (labelText && id) {
                        unresolved.push({ id, question: labelText.replace(/\n/g, ' ').trim() });
                    }
                }
                fs.writeFileSync(path.resolve('data/unresolved_questions.json'), JSON.stringify(unresolved, null, 2));
            } catch(e) {}

            if (shouldGenerate || fs.existsSync(path.resolve('data/unresolved_questions.json'))) {
                const jdText = await jdContainer.allInnerTexts();
                fs.writeFileSync(path.resolve('data/job_description.txt'), jdText.join('\n\n'));
                import('child_process').then(({ spawnSync }) => {
                    spawnSync('node', [path.resolve('generate-cover-letter.mjs')], { stdio: 'inherit' });
                });
            } else {
                console.log("Cover Letter is optional and no dynamic QA needed. Bypassing synthesis.");
            }
        }
    } catch(e) {}

    // FIll Dynamic QA Answers directly into the DOM
    console.log("Mapping Dynamic QA responses to the DOM...");
    try {
        const answersPath = path.resolve('data/dynamic_answers.json');
        if (fs.existsSync(answersPath)) {
            const answers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
            for (const [id, val] of Object.entries(answers)) {
                const el = page.locator(`textarea[id="${id}"], textarea[name="${id}"], input[id="${id}"], input[name="${id}"]`);
                if (await el.count() > 0) await el.first().fill(val);
            }
        }
    } catch(e) {}

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
    
    console.log("Attaching Cover Letter (if exists)...");
    try {
        let clPath = path.resolve('data/dynamic_cover_letter.pdf');
        if (!fs.existsSync(clPath)) {
            clPath = path.resolve('data/cover_letter.pdf');
        }
        
        if (fs.existsSync(clPath)) {
            const clInputs = page.locator('input[type="file"][name*="cover"], input[type="file"][name*="comment"]');
            if (await clInputs.count() > 0) {
                await clInputs.first().setInputFiles(clPath);
                console.log("✅ Cover letter explicit attachment found.");
            } else {
                const genericFileInputs = page.locator('input[type="file"]');
                if (await genericFileInputs.count() > 1) {
                    await genericFileInputs.nth(1).setInputFiles(clPath);
                    console.log("✅ Cover letter generic attachment filled.");
                }
            }
        }
    } catch (e) {
        console.error("❌ Failed to attach cover letter automatically.", e.message);
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
                let text = container ? container.textContent.toLowerCase() : '';
                
                const labelledBy = node.getAttribute('aria-labelledby');
                if (labelledBy) {
                    const ids = labelledBy.split(' ');
                    for (const lblId of ids) {
                        const lbl = document.getElementById(lblId);
                        if (lbl) text += ' ' + lbl.textContent.toLowerCase();
                    }
                }
                return text;
            });

            const options = await select.$$eval('option', opts => opts.map(o => o.textContent.trim()));

            let targetValue = null;
            if (lowerText.includes('authorized to work') && lowerText.includes('without sponsorship')) {
                targetValue = 'Yes';
            } else if (lowerText.includes('require sponsorship') || lowerText.includes('need sponsorship')) {
                targetValue = 'No';
            } else if (lowerText.includes('authorized to work')) {
                targetValue = 'Yes';
            } else if (lowerText.includes('past 6 months') || lowerText.includes('previously applied')) {
                targetValue = 'No';
            } else if (lowerText.includes('hear') || lowerText.includes('source') || lowerText.includes('find out')) {
                const matchSrc = options.find(o => o && (
                    o.toLowerCase().includes('linkedin') || 
                    o.toLowerCase().includes('company website') || 
                    o.toLowerCase().includes('direct') ||
                    o.toLowerCase().includes('job board')
                ));
                if (matchSrc) targetValue = matchSrc;
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
    
    // Dynamic React-Select traversal for obfuscated IDs (Anthropic/Glean)
    try {
        const comboboxes = await page.$$('input.select__input[role="combobox"]');
        for (const box of comboboxes) {
            try {
                const lowerText = await box.evaluate((el) => {
                    const ctx = el.closest('div.field, .application-question, label') || el.closest('div');
                    let text = ctx ? ctx.textContent.toLowerCase() : '';
                    
                    const labelledBy = el.getAttribute('aria-labelledby');
                    if (labelledBy) {
                        const ids = labelledBy.split(' ');
                        for (const lblId of ids) {
                            const lbl = document.getElementById(lblId);
                            if (lbl) text += ' ' + lbl.textContent.toLowerCase();
                        }
                    }
                    return text;
                });

                let fillValue = null;
                if (lowerText.includes('gender')) fillValue = 'Male';
                else if (lowerText.includes('race') || lowerText.includes('hispanic')) fillValue = 'Hispanic or Latino';
                else if (lowerText.includes('veteran')) fillValue = 'not a protected veteran';
                else if (lowerText.includes('disability')) fillValue = 'Decline';
                else if (lowerText.includes('sponsorship') || lowerText.includes('visa')) fillValue = 'No';
                else if (lowerText.includes('authorized') || lowerText.includes('legally')) fillValue = 'Yes';
                else if (lowerText.includes('hear') || lowerText.includes('source')) fillValue = 'LinkedIn';
                
                if (fillValue) {
                    await box.evaluate((el) => { 
                         el.style.opacity = "1"; 
                         el.style.position = "static";
                         el.style.display = "block";
                         el.style.width = "auto";
                    });
                    const id = await box.evaluate(el => el.getAttribute('id'));
                    const locator = id ? page.locator(`input.select__input[role="combobox"][id="${id}"]`).first() : box;
                    
                    await locator.focus({ force: true }).catch(()=>{});
                    const currentVal = await locator.inputValue().catch(()=>'');
                    if (!currentVal) {
                        await locator.fill("").catch(()=>{});
                        await locator.pressSequentially(fillValue, { delay: 50 }).catch(()=>{});
                        await page.waitForTimeout(600);
                        await locator.press('Enter').catch(()=>{});
                        await page.waitForTimeout(300);
                    }
                }
            } catch(e) {}
        }
    } catch(e) {}

    const safeReactSelect = async (id, value) => {
        try {
            // Find input matching either explicit ID or aria-autocomplete combobox role
            const locator = page.locator(`input.select__input[id="${id}"]`);
            if (await locator.count() > 0) {
                await locator.evaluate((el) => { 
                     el.style.opacity = "1"; 
                     el.style.position = "static";
                     el.style.display = "block";
                     el.style.width = "auto";
                });
                await locator.focus({ force: true });
                await locator.fill("");
                await locator.pressSequentially(value, { delay: 30 });
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
        const catchAll = profileConfig?.narrative?.catch_all || 'N/A - all relevant information is provided in the resume.';
        
        // Scan textareas specifically in case block wrappers fail on Greenhouse
        const allTextAreas = await page.$$('textarea');
        for (const area of allTextAreas) {
            try {
                const ariaLabel = (await area.getAttribute('aria-label') || '').toLowerCase();
                const parentLabel = await area.$('xpath=ancestor::div[contains(@class,"field")] | ancestor::label | preceding-sibling::label');
                const text = parentLabel ? await parentLabel.textContent() : '';
                const lowerText = text ? text.toLowerCase() : '';
                const combinedLabel = ariaLabel + " " + lowerText;

                if (combinedLabel.includes('why') || combinedLabel.includes('interest') || combinedLabel.includes('reason') || combinedLabel.includes('cover letter') || combinedLabel.includes('achievement') || combinedLabel.includes('project') || combinedLabel.includes('hume')) {
                    if (!(await area.inputValue())) await area.fill(exitStory);
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await area.inputValue())) await area.fill(catchAll);
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
                } else if (ariaLabel.includes('linkedin')) {
                    if (!(await input.inputValue())) await input.fill(profileConfig?.candidate?.linkedin || '');
                } else if (ariaLabel.includes('website') || ariaLabel.includes('portfolio') || ariaLabel.includes('github')) {
                    const u = ariaLabel.includes('website') || ariaLabel.includes('portfolio') ? profileConfig?.candidate?.portfolio_url : profileConfig?.candidate?.github;
                    if (!(await input.inputValue())) await input.fill(u || '');
                } else if (ariaLabel.includes('preferred') || ariaLabel.includes('pronounce')) {
                    const name = profileConfig?.candidate?.full_name?.split(' ')[0] || "Daniel";
                    if (!(await input.inputValue())) await input.fill(name);
                } else if (ariaLabel.includes('title')) {
                    if (!(await input.inputValue())) await input.fill(profileConfig?.candidate?.title || 'Engineer');
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
        const allCombos = await page.locator('input.select__input[role="combobox"]').elementHandles();
        for (const combo of allCombos) {
            try {
                const ariaLabelledBy = await combo.getAttribute('aria-labelledby');
                if (ariaLabelledBy) {
                    const labelEl = await page.$(`[id="${ariaLabelledBy}"]`);
                    if (labelEl) {
                        const labelText = ((await labelEl.textContent()) || '').toLowerCase();
                        if (labelText.includes('sponsorship') || labelText.includes('require visa')) {
                             await combo.focus();
                             await combo.pressSequentially('No', { delay: 30 });
                             await page.waitForTimeout(300);
                             await combo.press('Enter');
                             await page.waitForTimeout(200);
                        } else if (labelText.includes('authorized to work') || labelText.includes('right to work') || labelText.includes('eligibility')) {
                             await combo.focus();
                             await combo.pressSequentially('Yes', { delay: 30 });
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
        
        // Handle specific ATS array fields like "Skills" or "Cloud tools" mapping
        const skillsMap = profileConfig?.narrative?.skills || [];
        if (skillsMap.length > 0) {
            const allCheckboxes = await page.$$('input[type="checkbox"]');
            for (const check of allCheckboxes) {
                try {
                    let labelText = (await check.getAttribute('aria-label') || '').toLowerCase();
                    if (!labelText) {
                         const lbl = await page.evaluateHandle(el => el.closest('label') || el.parentElement, check);
                         if (lbl) labelText = ((await lbl.textContent()) || '').toLowerCase();
                    }
                    
                    // If any skill exists entirely within this checkbox label, check it natively
                    for (const skill of skillsMap) {
                        if (labelText.includes(skill.toLowerCase())) {
                            if (!(await check.isChecked())) await check.check({force: true}).catch(()=>{});
                            break;
                        }
                    }
                } catch(e) {}
            }
        }
        
        // Handle Years of Experience generically
        try {
            const expBlocks = await page.$$('label, div');
            for (const block of expBlocks) {
                const txt = (await block.textContent() || '').toLowerCase();
                if ((txt.includes('years') && txt.includes('experience')) || txt.includes('yoe')) {
                    const inp = await block.$('input[type="number"], input[type="text"]');
                    if (inp && !(await inp.inputValue())) {
                        let yoe = profileConfig?.experience_years?.default_yoe || 5;
                        for (const [key, val] of Object.entries(profileConfig?.experience_years || {})) {
                            if (key !== 'default_yoe' && txt.includes(key.replace('_', ' '))) {
                                yoe = val; break;
                            }
                        }
                        await inp.fill(yoe.toString()).catch(()=>{});
                    }
                }
            }
        } catch(e) {}

        // Handle Radio Matrices (Proficiency & Demographics)
        try {
            const radioGroups = await page.evaluate(() => {
                let groups = {};
                document.querySelectorAll('input[type="radio"]').forEach(r => {
                    if (r.name) groups[r.name] = true;
                });
                return Object.keys(groups);
            });
            
            for (const rName of radioGroups) {
                const radios = page.locator(`input[type="radio"][name="${rName}"]`);
                const count = await radios.count();
                if (count > 0) {
                    const groupLabelText = await radios.first().evaluate(el => {
                        let n = el;
                        for (let i = 0; i < 4; i++) { if (!n) break; n = n.parentElement; }
                        return n ? (n.textContent || '').toLowerCase() : '';
                    });
                    
                    let mapped = false;
                    for (const [key, val] of Object.entries(profileConfig?.experience_years || {})) {
                        if (key !== 'default_yoe' && groupLabelText.includes(key.replace('_', ' '))) {
                            for (let i = 0; i < count; i++) {
                                const r = radios.nth(i);
                                const lbl = await r.evaluate(el => {
                                    const l = el.closest('label') || el.parentElement;
                                    return l ? (l.textContent || '').toLowerCase() : '';
                                });
                                if (lbl.includes('5') || lbl.includes('expert') || lbl.includes('advanced')) {
                                    if (!(await r.isChecked())) await r.check({force: true}).catch(()=>{});
                                    mapped = true; break;
                                }
                            }
                        }
                    }
                    
                    if (!mapped && count === 2) {
                        const lbl1 = await radios.nth(0).evaluate(el => (el.closest('label') || el.parentElement)?.textContent?.toLowerCase() || '');
                        const lbl2 = await radios.nth(1).evaluate(el => (el.closest('label') || el.parentElement)?.textContent?.toLowerCase() || '');
                        if ((lbl1.includes('yes') && lbl2.includes('no')) || (lbl1.includes('no') && lbl2.includes('yes'))) {
                            if (groupLabelText.includes('authorized') || groupLabelText.includes('legally')) {
                                const authPos = lbl1.includes('yes') ? 0 : 1;
                                if (profileConfig?.eeo_demographics?.authorized_to_work === "Yes") await radios.nth(authPos).check({force:true}).catch(()=>{});
                            } else if (groupLabelText.includes('sponsorship') || groupLabelText.includes('visa')) {
                                const spPos = lbl1.includes('no') ? 0 : 1;
                                if (profileConfig?.eeo_demographics?.requires_sponsorship === "No") await radios.nth(spPos).check({force:true}).catch(()=>{});
                            }
                        }
                    }
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
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]):not([tabindex="-1"][aria-hidden="true"]), textarea:not([name="g-recaptcha-response"]):not(.g-recaptcha-response), select'));
        let total = inputs.length;
        let filled = 0;
        const missingDOM = [];
        
        for (const el of inputs) {
            let isFilled = false;
            
            if (window.getComputedStyle(el).opacity === '0' || el.offsetWidth === 0) {
                total--; continue; // Skip actual non-interactable
            }

            if (el.tagName === 'SELECT') {
                if (el.selectedIndex > 0 || (el.value && el.value !== "" && el.value !== "0")) isFilled = true;
            } else if (el.type === 'checkbox' || el.type === 'radio') {
                if (el.name) {
                   const cleanName = el.name.split('[')[0]; 
                   const group = document.querySelectorAll(`input[name^="${cleanName}"]`);
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
                let isReq = el.required || el.getAttribute('aria-required') === 'true';
                if (!isReq) {
                    let p = el;
                    for (let i = 0; i < 4; i++) {
                        if (!p) break;
                        if (p.classList && p.classList.contains('required')) isReq = true;
                        if (p.textContent && (p.textContent.includes('*') || p.textContent.includes('(required)'))) isReq = true;
                        p = p.parentElement;
                    }
                }
                
                if (!isReq) {
                    total--;
                    continue;
                }

                const container = el.closest('div.field, label') || el.closest('div') || el;
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
