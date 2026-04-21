import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

// Dynamically extract Profile configuration for the Heuristics Engine
let profileConfig = {};
try {
    const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
    profileConfig = yaml.load(fileContents);
} catch (e) {
    console.log("⚠️ Could not load profile.yml for advanced heuristics.");
}

export async function populateGreenhouse(page, targetUrl, resumePath, profileConfig, isBatch = false) {
    const url = targetUrl;

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
        // Try clicking the attach button to reveal hidden file input (Greenhouse v2)
        const attachBtns = page.locator('button[data-source="attach"], .resume-submit-group button, a[data-source="attach"]');
        if (await attachBtns.count() > 0) {
            await attachBtns.first().click({ force: true }).catch(() => {});
            await page.waitForTimeout(500);
        }
        
        await page.waitForSelector('input[type="file"]', { timeout: 8000 }).catch(() => {});
        
        // Try all known Greenhouse file input selectors in priority order
        let fileInput = page.locator('#resume_upload');
        if (await fileInput.count() === 0) fileInput = page.locator('input[type="file"][id="resume"]');
        if (await fileInput.count() === 0) fileInput = page.locator('input[type="file"][name="resume"]');
        if (await fileInput.count() === 0) fileInput = page.locator('input[type="file"]').first();
        
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles(path.resolve(resumePath));
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

    console.log("Satisfying arbitrary extra file upload requirements...");
    try {
        const extraFiles = await page.$$('input[type="file"]');
        for (const fileInput of extraFiles) {
            const isFilled = await page.evaluate(el => el.files && el.files.length > 0, fileInput);
            if (!isFilled) {
                const isReq = await page.evaluate(el => {
                    if (el.required || el.getAttribute('aria-required') === 'true') return true;
                    let p = el.parentElement;
                    for (let i=0; i<5; i++) {
                        if (!p) break;
                        if (p.classList && p.classList.contains('required')) return true;
                        if (p.textContent && p.textContent.includes('*')) return true;
                        p = p.parentElement;
                    }
                    return false;
                }, fileInput);
                if (isReq) {
                    await fileInput.setInputFiles(resumePath).catch(()=>{});
                    console.log("✅ Arbitrary required file attachment satisfied via Resume fallback.");
                }
            }
        }
    } catch(e) {}

    console.log("Filling standard details...");
    
        let lastMousePosition = { x: 0, y: 0 };
    const biometricClick = async (page, locator) => {
        try {
            if (await locator.count() === 0) return;
            const box = await locator.first().boundingBox();
            if (!box) { await locator.first().click({ force: true }); return; }
            const targetX = box.x + (box.width * (0.3 + Math.random() * 0.4));
            const targetY = box.y + (box.height * (0.3 + Math.random() * 0.4));
            try {
                const { path } = await import('ghost-cursor');
                const route = path(lastMousePosition, { x: targetX, y: targetY });
                for (const pt of route) {
                    await page.mouse.move(pt.x, pt.y);
                    await page.waitForTimeout(Math.random() * 3 + 1);
                }
            } catch(e) {
                await page.mouse.move(targetX, targetY, { steps: 10 });
            }
            lastMousePosition = { x: targetX, y: targetY };
            await page.waitForTimeout(Math.random() * 50 + 20);
            await locator.first().click();
        } catch (e) {
            await locator.first().click({ force: true });
        }
    };

    const safeFill = async (selector, value) => {
        try {
            const els = page.locator(selector);
            const count = await els.count();
            for (let i = 0; i < count; i++) {
                const el = els.nth(i);
                if (await el.isVisible()) {
                    await el.focus();
                    await el.fill("");
                    await el.pressSequentially(value, { delay: Math.floor(Math.random() * 30) + 15 });
                    await page.waitForTimeout(Math.floor(Math.random() * 300) + 100); 
                    break; // Successfully filled a visible node, stop searching
                }
            }
        } catch (e) {}
    };

    // Greenhouse explicitly separates First/Last name but employer templates often alter IDs
    await safeFill('input[id*="first_name"], input[name*="first_name"], input[autocomplete*="given-name"]', profileConfig?.candidate?.full_name?.split(' ')[0] || 'Daniel');
    await safeFill('input[id*="last_name"], input[name*="last_name"], input[autocomplete*="family-name"]', profileConfig?.candidate?.full_name?.split(' ').slice(1).join(' ') || 'Hardesty Lewis');
    await safeFill('#email, input[id*="email"], input[name*="email"], input[type="email"]', profileConfig?.candidate?.email || 'daniel@homecastr.com');
    await safeFill('#phone, input[id*="phone"], input[name*="phone"]', profileConfig?.candidate?.phone || '+1 (713) 371-7875');
    await safeFill('#org', 'Homecastr');
    await safeFill('#job_application_employer', 'Homecastr');
    await safeFill('input[id*="employer"], input[id*="company"], input[name*="employer"]', 'Homecastr');

    // Standard Greenhouse URL and generic field mappings
    await safeFill('input[autocomplete="custom-network-linkedin"]', 'https://linkedin.com/in/dhardestylewis');
    await safeFill('input[autocomplete="custom-network-github"]', 'https://github.com/dhardestylewis');
    await safeFill('input[autocomplete="custom-network-portfolio"]', 'https://dlewis.ai');
    // ID/placeholder-based fallbacks
    await safeFill('input[id*="linkedin"], input[name*="linkedin"]', 'https://linkedin.com/in/dhardestylewis');
    await safeFill('input[id*="github"], input[name*="github"]', 'https://github.com/dhardestylewis');
    await safeFill('input[id*="website"], input[id*="portfolio"]', 'https://dlewis.ai');
    await safeFill('input[id*="twitter"]', '');
    // Placeholder-based fallbacks
    await safeFill('input[placeholder*="LinkedIn"], input[placeholder*="linkedin"]', 'https://linkedin.com/in/dhardestylewis');
    await safeFill('input[placeholder*="GitHub"], input[placeholder*="github"]', 'https://github.com/dhardestylewis');
    // Phone - Greenhouse uses type=tel in some forms
    await safeFill('input[type="tel"]', profileConfig?.candidate?.phone || '+1 (713) 371-7875');

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
            } else if (lowerText.includes('phone') && (lowerText.includes('country') || lowerText.includes('code'))) {
                const matchSrc = options.find(o => o && (o.includes('United States') || o.includes('+1')));
                if (matchSrc) targetValue = matchSrc;
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
            if (await el.count() > 0 && await el.first().isVisible()) {
                const selectElement = await el.first().elementHandle();
                const options = await selectElement.$$eval('option', opts => opts.map(o => o.textContent));
                // Add strict heuristic for gender to prevent matching 'Female' just because it has 'Male' inside the string
                const match = options.find(o => {
                    o = o ? o.toLowerCase() : '';
                    if (value.toLowerCase() === 'male' && o.includes('female')) return false;
                    return o.includes(value.toLowerCase());
                });
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
                if ((lowerText.includes('phone') || lowerText.includes('dialing')) && (lowerText.includes('country') || lowerText.includes('code'))) fillValue = 'United States';
                else if (lowerText.includes('gender') || lowerText.includes('identify') || lowerText.includes('sex')) fillValue = 'Male';
                else if (lowerText.includes('hispanic') || lowerText.includes('latino')) fillValue = 'Yes';
                else if (lowerText.includes('race')) fillValue = 'Hispanic or Latino';
                else if (lowerText.includes('veteran')) fillValue = 'not a protected veteran';
                else if (lowerText.includes('disability')) fillValue = 'Decline';
                else if (lowerText.includes('authorized') || lowerText.includes('legally')) fillValue = 'Yes';
                else if (lowerText.includes('relocat')) fillValue = 'Yes';
                else if (lowerText.includes('sponsorship') || lowerText.includes('visa')) fillValue = 'No';
                else if (lowerText.includes('hear') || lowerText.includes('source')) fillValue = 'LinkedIn';
                
                // Execute heuristic targeting if keyword mapped
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
                    const isAlreadyFilled = await box.evaluate(el => !!el.closest('div').querySelector('[class*="single-value"]'));
                    if (!isAlreadyFilled) {
                        await locator.fill("").catch(()=>{});
                        await locator.pressSequentially(fillValue, { delay: 50 }).catch(()=>{});
                        await page.waitForTimeout(600);
                        await locator.press('Enter').catch(()=>{});
                        await page.waitForTimeout(300);
                    }
                }
                
                // Fallback for explicitly required esoteric Dropdowns (or if above fillValue failed to lock)
                const isReq = await box.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                if (isReq) {
                    try {
                        const isFilled = await box.evaluate(el => !!el.closest('div').querySelector('[class*="single-value"]'));
                        if (!isFilled) {
                            const id = await box.evaluate(el => el.getAttribute('id'));
                            const locator = id ? page.locator(`input.select__input[role="combobox"][id="${id}"]`).first() : box;
                            await locator.focus({ force: true }).catch(()=>{});
                            await locator.fill("").catch(()=>{}); // Clear bad typings
                            await locator.press('ArrowDown').catch(()=>{}); // Expand menu
                            await page.waitForTimeout(300);
                            await locator.press('ArrowDown').catch(()=>{}); // Move to option 1
                            await page.waitForTimeout(100);
                            await locator.press('ArrowDown').catch(()=>{}); // Move to option 2 (skip 'Select...' placeholder)
                            await page.waitForTimeout(100);
                            await locator.press('Enter').catch(()=>{});
                            await page.waitForTimeout(300);
                        }
                    } catch(e) {}
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

                const isBehavioral = combinedLabel.includes('why') || combinedLabel.includes('interest') || combinedLabel.includes('reason') || combinedLabel.includes('cover letter') || combinedLabel.includes('excite') || combinedLabel.includes('mission') || combinedLabel.includes('fit') || combinedLabel.includes('value') || combinedLabel.includes('resonate');
                const isTechnical = combinedLabel.includes('describe') || combinedLabel.includes('experience') || combinedLabel.includes('background') || combinedLabel.includes('proud') || combinedLabel.includes('impressive') || combinedLabel.includes('achievement') || combinedLabel.includes('project') || combinedLabel.includes('built') || combinedLabel.includes('workflow') || combinedLabel.includes('feature') || combinedLabel.includes('sql') || combinedLabel.includes('python') || combinedLabel.includes('skills') || combinedLabel.includes('rate your') || combinedLabel.includes('tools') || combinedLabel.includes('ai') || combinedLabel.includes('technologies');

                if (combinedLabel.includes('years')) {
                    if (!(await area.inputValue())) await area.fill("10");
                } else if (isBehavioral) {
                    const interest = profileConfig?.narrative?.interest_statement || exitStory;
                    if (!(await area.inputValue())) await area.fill(interest);
                } else if (isTechnical) {
                    if (!(await area.inputValue())) await area.fill(exitStory);
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await area.inputValue())) await area.fill(catchAll);
                } else {
                    // Fallback: any required unfilled textarea gets catchAll
                    const isReq = await area.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                    if (isReq && !(await area.inputValue())) await area.fill(catchAll);
                }
            } catch(e) {}
        }
        
        // Scan custom inputs directly reading Aria labels to bypass broken parent DOM hierarchies
        const allInputs = await page.$$('input[type="text"]');
        for (const input of allInputs) {
            try {
                const ariaLabel = (await input.getAttribute('aria-label') || '').toLowerCase();
                const parentLabel = await input.$('xpath=ancestor::div[contains(@class,"field")] | ancestor::label | preceding-sibling::label').catch(()=>null);
                const text = parentLabel ? await parentLabel.textContent().catch(()=>'') : '';
                const lowerText = text ? text.toLowerCase() : '';
                const combinedLabel = ariaLabel + " " + lowerText;
                
                const isBehavioral = combinedLabel.includes('why') || combinedLabel.includes('interest') || combinedLabel.includes('reason') || combinedLabel.includes('cover letter') || combinedLabel.includes('excite') || combinedLabel.includes('mission') || combinedLabel.includes('fit') || combinedLabel.includes('value') || combinedLabel.includes('resonate');
                const isTechnical = combinedLabel.includes('describe') || combinedLabel.includes('experience') || combinedLabel.includes('background') || combinedLabel.includes('proud') || combinedLabel.includes('impressive') || combinedLabel.includes('achievement') || combinedLabel.includes('project') || combinedLabel.includes('built') || combinedLabel.includes('workflow') || combinedLabel.includes('feature') || combinedLabel.includes('sql') || combinedLabel.includes('python') || combinedLabel.includes('skills') || combinedLabel.includes('rate your') || combinedLabel.includes('tools') || combinedLabel.includes('ai') || combinedLabel.includes('technologies');
                
                if (combinedLabel.includes('years')) {
                    if (!(await input.inputValue())) await input.fill("10");
                } else if (isBehavioral) {
                    const interest = profileConfig?.narrative?.interest_statement || exitStory;
                    if (!(await input.inputValue())) await input.fill(interest);
                } else if (isTechnical) {
                    if (!(await input.inputValue())) await input.fill(exitStory);
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await input.inputValue())) await input.fill(catchAll);
                } else if (combinedLabel.includes('salary') || combinedLabel.includes('compensation') || combinedLabel.includes('expectations') || combinedLabel.includes('package')) {
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
                } else {
                    // Fallback: any unfilled required input gets the catchAll answer
                    const isReq = await input.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                    if (isReq && !(await input.inputValue())) await input.fill("N/A - See Resume");
                }
            } catch(e) {}
        }
        
        // Check generic required checkboxes like GDPR or Consent agreements
        const consentChecks = await page.$$('input[type="checkbox"]');
        for (const check of consentChecks) {
            try {
                const name = (await check.getAttribute('name') || '').toLowerCase();
                const isReq = await check.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                
                const labelText = await check.evaluate(el => {
                    const ctx = el.closest('label') || el.parentElement;
                    return ctx ? ctx.textContent.toLowerCase() : '';
                }).catch(()=>'');

                if (isReq || name.includes('gdpr') || name.includes('consent') || name.includes('terms') || name.includes('agree') || labelText.includes('agree') || labelText.includes('confirm') || labelText.includes('certify') || labelText.includes('acknowledge') || labelText.includes('understand') || labelText.includes('policy') || labelText.includes('consent')) {
                    if (!(await check.isChecked())) await check.check({force: true}).catch(()=>{});
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

            // Ignore standard fields — only skip if label is predominantly about that field
            const skipTerms = ['upload resume', 'upload cv', 'first name', 'last name', 'email address', 'phone number', 'current company'];
            if (skipTerms.some(t => lowerText.trim().startsWith(t) || lowerText.includes(`\n${t}`))) {
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
                        else await biometricClick(page, label.first());
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
                    await biometricClick(page, heHimLabel.first());
                }
            } else if (gender.includes('female')) {
                const sheHerLabel = page.getByText('She/her', { exact: false });
                if (await sheHerLabel.count() > 0 && await sheHerLabel.first().isVisible()) {
                    await biometricClick(page, sheHerLabel.first());
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
                            if (groupLabelText.includes('authorized to work') && groupLabelText.includes('sponsorship')) {
                                const authPos = lbl1.includes('yes') ? 0 : 1;
                                await radios.nth(authPos).check({force:true}).catch(()=>{});
                            } else if (groupLabelText.includes('authorized') || groupLabelText.includes('legally') || groupLabelText.includes('relocat') || groupLabelText.includes('hispanic')) {
                                const authPos = lbl1.includes('yes') ? 0 : 1;
                                await radios.nth(authPos).check({force:true}).catch(()=>{});
                            } else if (groupLabelText.includes('sponsorship') || groupLabelText.includes('visa')) {
                                const spPos = lbl1.includes('no') ? 0 : 1;
                                if (profileConfig?.eeo_demographics?.requires_sponsorship === "No") await radios.nth(spPos).check({force:true}).catch(()=>{});
                            }
                        }
                    }
                    
                    if (!mapped && count > 1) {
                        if (groupLabelText.includes('gender') || groupLabelText.includes('identify') || groupLabelText.includes('sex')) {
                            // Find radio button explicitly for Male (excluding Female)
                            for (let i = 0; i < count; i++) {
                                const l = await radios.nth(i).evaluate(el => (el.closest('label') || el.parentElement)?.textContent?.toLowerCase() || '');
                                if (l.includes('male') && !l.includes('female')) {
                                    await radios.nth(i).check({force:true}).catch(()=>{});
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch(e) {}
    } catch(e) {}

    console.log("Injecting Radio Array Required Fallbacks...");
    try {
        const requiredRadios = await page.$$('input[type="radio"]');
        const handledGroups = new Set();
        for (const radio of requiredRadios) {
            const name = await radio.getAttribute('name');
            if (!name || handledGroups.has(name)) continue;
            
            const isReq = await radio.evaluate(el => {
                if (el.required || el.getAttribute('aria-required') === 'true') return true;
                let p = el.parentElement;
                for (let i=0; i<4; i++) {
                    if(!p) break;
                    if(p.classList && p.classList.contains('required')) return true;
                    if(p.textContent && p.textContent.includes('*')) return true;
                    p = p.parentElement;
                }
                return false;
            });

            if (isReq) {
                handledGroups.add(name);
                const group = page.locator(`input[type="radio"][name="${name}"]`);
                const isChecked = await group.evaluateAll(els => els.some(el => el.checked));
                if (!isChecked && await group.count() > 0) {
                    await group.first().check({force: true}).catch(()=>{});
                }
            }
        }
    } catch (e) {}

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
            } else if (el.classList && el.classList.contains('select__input')) {
                const container = el.closest('div');
                if (container && (container.querySelector('[class*="single-value"]') || container.parentElement.querySelector('[class*="single-value"]'))) {
                    isFilled = true;
                } else if (el.value && el.value.length > 0) {
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
        if (metrics.fillPercentage < 100) {
            console.log('Skipping submission natively: Fill criteria not met (' + metrics.fillPercentage + '%).');
            metrics.status = 'Incomplete';
            return metrics;
        }
        if (metrics.fillPercentage < 100) {
            console.log('Skipping submission natively: Fill criteria not met (' + metrics.fillPercentage + '%).');
            metrics.status = 'Incomplete';
            return metrics;
        }
        // Live Submission Phase
        try {
            console.log("Simulating native human intent vectors...");
            await page.mouse.wheel(0, Math.floor(Math.random() * 500) + 300);
            await page.waitForTimeout(Math.floor(Math.random() * 800) + 400);
            await page.mouse.wheel(0, -Math.floor(Math.random() * 300) + 100);
            
            console.log("Locating Greenhouse POST submit button...");
            const submitBtn = page.locator('#submit_app');
            if (await submitBtn.count() > 0) {
                const box = await submitBtn.first().boundingBox();
                if (box) {
                    await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2), { steps: Math.floor(Math.random() * 15) + 10 });
                }
                await page.waitForTimeout(Math.floor(Math.random() * 400) + 200);
                
                await biometricClick(page, submitBtn.first());
                console.log("Greenhouse Submission Button Clicked.");
                
                // Monitor for CAPTCHA
                try {
                    console.log("Waiting for network resolution or CAPTCHA intercept...");
                    await Promise.race([
                        page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' }),
                        page.waitForSelector('iframe[src*="captcha"]', { timeout: 15000 }).then(el => { if(el) throw new Error("CAPTCHA"); })
                    ]);
                    metrics.status = "Success";
                    await page.waitForTimeout(6000);
                } catch (navError) {
                    if (navError.message === "CAPTCHA") {
                        console.error("[WARN] CAPTCHA Intercepted. Application paused/failed.");
                        metrics.status = "CAPTCHA_BLOCKED";
                    } else {
                        // Sometimes the navigation timeout fires because Greenhouse uses async XHR post instead of page reload.
                        const errorMsg = page.locator('.error');
                        if (await errorMsg.count() > 0 && await errorMsg.isVisible()) {
                            metrics.status = "Submission_Error";
                        } else {
                            metrics.status = "Success";
                    await page.waitForTimeout(6000); // Implicit assuming XHR passed
                        }
                    }
                }

                // 2FA Email Verification Hook
                const verifyInput = page.locator('input[name*="code"], input[name*="verify"], input[type="text"][placeholder*="character"], input[aria-label*="Security code"]');
                if (await verifyInput.count() > 0 && await verifyInput.first().isVisible().catch(()=>false)) {
                    console.log("\n⚠️ [2FA Triggered] Intercepting Verification Code from Email...");
                    const emailAddress = profileConfig?.candidate?.email || 'daniel@homecastr.com';
                    try {
                        const { waitForVerificationCode } = await import('file:///' + path.resolve('email-interceptor.mjs').replace(/\\/g, '/'));
                        const code = await waitForVerificationCode(emailAddress, 75);
                        if (code) {
                            await verifyInput.first().fill(code);
                            await page.waitForTimeout(500);
                            const confirmBtn = page.locator('button:has-text("Submit"), button:has-text("Confirm"), button:has-text("Verify")');
                            if (await confirmBtn.count() > 0) await confirmBtn.first().click().catch(()=>{});
                            metrics.status = "Success";
                            console.log("✅ 2FA Verification successfully bypassed and injected!");
                            await Promise.race([ page.waitForNavigation({ timeout: 10000 }).catch(()=>{}), page.waitForTimeout(4000) ]);
                        } else {
                            console.log("❌ Failed to intercept validation code. Pausing for manual entry.");
                            metrics.status = "Success_Unverified";
                        }
                    } catch(err) { console.error("Email Interceptor Crash:", err.message); }
                }
            } else {
                metrics.status = "Submit_Button_Missing";
            }
        } catch (e) {
            metrics.status = "Submission_Exception";
        }
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

}




import { fileURLToPath } from 'url';
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
            await populateGreenhouse(page, targetUrl, targetResumeUrl, profileConfig, isBatch);
        } catch (e) {
            console.error(e);
        }
        
        // Let the unified handler deal with cleanup, but for CLI we kill here:
        if (isBatch) {
        if (metrics.fillPercentage < 100) {
            console.log('Skipping submission natively: Fill criteria not met (' + metrics.fillPercentage + '%).');
            metrics.status = 'Incomplete';
            return metrics;
        }
            await context.close();
        }
    })();
}






