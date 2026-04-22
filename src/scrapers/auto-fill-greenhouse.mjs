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
    
    let domain = 'default';
    if (url.includes('roblox.com') || url.includes('for=roblox')) domain = 'roblox';
    else if (url.includes('databricks.com') || url.includes('for=databricks')) domain = 'databricks';
    else if (url.includes('coreweave.com') || url.includes('for=coreweave')) domain = 'coreweave';
    else if (url.includes('appliedintuition.com') || url.includes('for=appliedintuition') || url.includes('appliedintuition/')) domain = 'appliedintuition';
    else if (url.includes('nuro.ai') || url.includes('for=nuro')) domain = 'nuro';

    const DOMAIN_OVERRIDES = {
        roblox: {
            gender: "Man",
            race: "Hispanic",
            veteran: "No, I am not",
            disability: "No, I do not",
            sponsorship: "Yes",
            authorized: "Yes",
            age: "Yes"
        },
        databricks: {
            previously_worked: "No",
            sponsorship: "No",
            authorized: "Yes"
        },
        appliedintuition: {
            country: "United States",
            school: "Texas",
            degree: "Bachelor",
            discipline: "Computer"
        },
        coreweave: {
            country: "United States"
        },
        nuro: {
            country: "United States"
        }
    };
    const domainOverrides = DOMAIN_OVERRIDES[domain] || {};

    console.log(`Navigating to ${url}... [Domain Context: ${domain}]`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log("Checking for embedded Greenhouse iframes...");
    try {
        await page.waitForTimeout(1500); // Wait for potential dynamic iframe injection
        const iframe = await page.$('iframe[src*="/embed/job_app"], iframe#grnhse_iframe');
        if (iframe) {
            const iframeSrc = await iframe.getAttribute('src');
            if (iframeSrc && !iframeSrc.includes('googleapis.com')) {
                console.log(`Detected embedded iframe. Redirecting to raw form: ${iframeSrc}`);
                await page.goto(iframeSrc, { waitUntil: 'domcontentloaded' });
            }
        }
    } catch(e) {}

    console.log("Waiting for form elements to load...");
    await page.waitForSelector('#first_name', { timeout: 4000 }).catch(async () => {
        // If form doesn't load immediately, we might be on a JD landing page that requires clicking "Apply"
        const applyBtn = page.locator('button:has-text("Apply"), a:has-text("Apply")').first();
        if (await applyBtn.count() > 0) {
            console.log("Form not found. Clicking 'Apply' button to reveal form...");
            await applyBtn.click().catch(() => {});
            await page.waitForTimeout(2000);
            
            // Check for iframes AGAIN in case clicking Apply popped open an iframe
            const iframe2 = await page.$('iframe[src*="/embed/job_app"], iframe#grnhse_iframe');
            if (iframe2) {
                const iframeSrc2 = await iframe2.getAttribute('src');
                if (iframeSrc2 && !iframeSrc2.includes('googleapis.com')) {
                    console.log(`Detected embedded iframe after clicking Apply. Redirecting: ${iframeSrc2}`);
                    await page.goto(iframeSrc2, { waitUntil: 'domcontentloaded' });
                }
            } else {
                await page.waitForSelector('#first_name', { timeout: 6000 }).catch(() => {});
            }
        }
    });

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
        // Skip for Roblox as it triggers a broken React upload hook exception
        if (domain !== 'roblox') {
            const attachBtns = page.locator('button[data-source="attach"], .resume-submit-group button, a[data-source="attach"]');
            if (await attachBtns.count() > 0) {
                await attachBtns.first().click({ force: true }).catch(() => {});
                await page.waitForTimeout(500);
            }
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
                await clInputs.first().evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
                console.log("✅ Cover letter explicit attachment found.");
            } else {
                const genericFileInputs = page.locator('input[type="file"]');
                if (await genericFileInputs.count() > 1) {
                    await genericFileInputs.nth(1).setInputFiles(clPath);
                    await genericFileInputs.nth(1).evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
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
                    await fileInput.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
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

    const logUnmappedDom = async (locator, reason) => {
        try {
            const data = await locator.evaluate(el => {
                const wrapper = el.closest('.field, .application-question, div[class*="question"]');
                const fullHtml = wrapper ? wrapper.outerHTML : (el.parentElement ? el.parentElement.outerHTML : el.outerHTML);
                
                let labelText = 'Unknown Label';
                try {
                    const id = el.id || el.getAttribute('aria-labelledby')?.replace('-label', '');
                    if (id) {
                        const labelEl = document.querySelector(`label[for="${id}"], label[id="${id}-label"]`) || el.closest('div').parentElement.querySelector('label');
                        if (labelEl) labelText = labelEl.innerText.trim();
                    }
                } catch(e) {}
                
                return { html: fullHtml, label: labelText };
            }).catch(()=>({ html: '', label: 'Error extracting label' }));
            
            if (data.html) {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    url: page.url(),
                    reason: reason,
                    label: data.label,
                    html: data.html
                };
                const logPath = path.resolve('logs/unmapped_dom.jsonl');
                if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
                fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
            }
        } catch(e) {}
    };

    // Greenhouse explicitly separates First/Last name but employer templates often alter IDs
    await safeFill('#first_name', profileConfig?.candidate?.first_name || 'Daniel');
    await safeFill('#last_name', profileConfig?.candidate?.last_name || 'Hardesty Lewis');
    await safeFill('#email', profileConfig?.candidate?.email || 'daniel@homecastr.com');
    const safePhone = (profileConfig?.candidate?.phone || '7133717875').replace(/[\s\+\(\)\-]/g, '');
    await safeFill('#phone', safePhone);
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
    await safeFill('input[type="tel"]', safePhone);

    // Autocomplete Location fields (Greenhouse requires actual UI interaction for the auto-select dropdown)
    try {
        const locField = page.locator('#job_application_location');
        if (await locField.count() > 0 && await locField.first().isVisible()) {
            await locField.first().focus();
            await locField.first().fill(""); // Clear first
            await locField.first().pressSequentially(profileConfig?.candidate?.location || 'New York, NY', { delay: 50 });
            try {
                await page.waitForSelector('ul.ui-autocomplete li:first-child', { state: 'visible', timeout: 5000 });
            } catch(e) {
                await page.waitForTimeout(1500); // Wait for the network call to fetch Google Places if selector is missing
            }
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
            } else if (lowerText.includes('alphabet employee') || lowerText.includes('former employee') || lowerText.includes('current employee')) {
                targetValue = 'No';
            } else if (lowerText.includes('authorized to work')) {
                targetValue = 'Yes';
            } else if (lowerText.includes('relocat') || lowerText.includes('onsite') || lowerText.includes('hybrid') || lowerText.includes('office')) {
                targetValue = 'Yes';
            } else if (lowerText.includes('past 6 months') || lowerText.includes('previously applied') || lowerText.includes('previously worked')) {
                targetValue = 'No';
            } else if (lowerText === 'country' || lowerText.includes('country code') || lowerText.includes('phone')) {
                const phoneMatch = options.find(o => o && o.includes('+1'));
                if (phoneMatch) targetValue = phoneMatch;
                else {
                    const usMatch = options.find(o => o && o.includes('United States'));
                    if (usMatch) targetValue = usMatch;
                }
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
                const match = options.find(o => o && (o.toLowerCase() === targetValue.toLowerCase() || o.toLowerCase().startsWith(targetValue.toLowerCase())));
                if (match) {
                     await select.selectOption({ label: match }, { force: true }).catch(async ()=> {
                          // Try raw value check if strict label bounding fails
                          await select.selectOption(match, { force: true }).catch(()=>{});
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
            if (await el.count() > 0) {
                const selectElement = await el.first().elementHandle();
                const options = await selectElement.$$eval('option', opts => opts.map(o => o.textContent));
                // Add strict heuristic for gender to prevent matching 'Female' just because it has 'Male' inside the string
                const match = options.find(o => {
                    o = o ? o.toLowerCase() : '';
                    if (value.toLowerCase() === 'male' && o.includes('female')) return false;
                    return o.includes(value.toLowerCase());
                });
                if (match) {
                    await el.selectOption({ label: match }, { force: true }).catch(()=>{});
                }
            }
        } catch (e) {}
    };

    // Greenhouse uses specific IDs rather than eeoc[] name arrays
    await safeSelect('job_application_gender', domainOverrides.gender || 'Male');
    await safeSelect('job_application_race', domainOverrides.race || 'Hispanic or Latino');
    await safeSelect('job_application_veteran_status', domainOverrides.veteran || 'not a protected veteran');
    await safeSelect('job_application_disability_status', domainOverrides.disability || 'Decline to self-identify');

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
                if (lowerText.includes('country')) fillValue = domainOverrides.country || 'United States';
                else if ((lowerText.includes('phone') || lowerText.includes('dialing')) && (lowerText.includes('country') || lowerText.includes('code'))) fillValue = 'United States';
                else if (lowerText.includes('gender') || lowerText.includes('identify') || lowerText.includes('sex')) fillValue = domainOverrides.gender || 'Male';
                else if (lowerText.includes('hispanic') || lowerText.includes('latino') || lowerText.includes('race') || lowerText.includes('ethnic')) fillValue = domainOverrides.race || 'Hispanic';
                else if (lowerText.includes('veteran')) fillValue = domainOverrides.veteran || 'not a protected veteran';
                else if (lowerText.includes('disability')) fillValue = domainOverrides.disability || "I don't wish to answer";
                else if (lowerText.includes('authorized') || lowerText.includes('legally') || lowerText.includes('u.s. person') || lowerText.includes('us person')) fillValue = domainOverrides.authorized || 'Yes';
                else if (lowerText.includes('relocat') || lowerText.includes('onsite') || lowerText.includes('hybrid') || lowerText.includes('office') || lowerText.includes('clearance') || lowerText.includes('salary') || lowerText.includes('comfortable') || lowerText.includes('18+') || lowerText.includes('age')) fillValue = domainOverrides.age || 'Yes';
                else if (lowerText.includes('experience') || lowerText.includes('familiar') || lowerText.includes('hands-on')) fillValue = 'Yes';
                else if (lowerText.includes('sponsorship') || lowerText.includes('visa') || lowerText.includes('previously worked')) fillValue = domainOverrides.sponsorship || domainOverrides.previously_worked || 'No';
                else if (lowerText.includes('hear') || lowerText.includes('source')) fillValue = 'LinkedIn';
                else if (lowerText.includes('school') || lowerText.includes('university') || lowerText.includes('college')) fillValue = 'Texas';
                else if (lowerText.includes('degree')) fillValue = 'Bachelor';
                else if (lowerText.includes('discipline') || lowerText.includes('major')) fillValue = 'Computer';
                else if (lowerText.includes('language') || lowerText.includes('programming')) fillValue = 'Python';
                else if (lowerText.includes('available to work') || lowerText.includes('start date')) fillValue = 'Immediately';
                else if (lowerText.includes('metropolitan') || lowerText.includes('residence')) fillValue = 'New York';
                else if (lowerText.includes('export') || lowerText.includes('sanctions') || lowerText.includes('confirm whether any of the below applies')) fillValue = 'None of the above';
                else if (lowerText.includes('prior question') || lowerText.includes('none of the above')) fillValue = 'Not applicable';
                
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
                        await locator.pressSequentially(fillValue, { delay: 80 }).catch(()=>{});
                        await page.waitForTimeout(800);
                        
                        // Search for the exact dropdown option and click it to prevent partial prefix matching
                        const options = await page.$$('div[class*="option"]');
                        let clicked = false;
                        for (const opt of options) {
                            const optText = await opt.innerText().catch(()=>'');
                            if (optText.trim() === fillValue.trim() || optText.trim().startsWith(fillValue.trim())) {
                                await opt.click().catch(()=>{});
                                clicked = true;
                                break;
                            }
                        }
                        if (!clicked) {
                            await locator.press('Enter').catch(()=>{});
                        }
                        await page.waitForTimeout(300);
                    }
                }
                
                // Fallback for explicitly required esoteric Dropdowns (or if above fillValue failed to lock)
                const isReq = await box.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                if (isReq) {
                    try {
                        const isFilled = await box.evaluate(el => {
                            const container = el.closest('div[class*="container"]') || el.closest('div');
                            if (container.querySelector('[class*="single-value"]')) return true;
                            const hidden = container.querySelector('input[type="hidden"]');
                            if (hidden && hidden.value) return true;
                            if (el.value && el.value.length > 0) return true;
                            return false;
                        });
                        if (!isFilled) {
                            await logUnmappedDom(box, "React Select Fallback");
                            const id = await box.evaluate(el => el.getAttribute('id'));
                            const locator = id ? page.locator(`input.select__input[role="combobox"][id="${id}"]`).first() : box;
                            await locator.focus({ force: true }).catch(()=>{});
                            await locator.fill("").catch(()=>{}); // Clear bad typings
                            await locator.press('ArrowDown').catch(()=>{}); // Expand menu
                            await page.waitForTimeout(300);
                            await locator.press('ArrowDown').catch(()=>{}); // Move to Option 1
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
    await safeReactSelect('hispanic_ethnicity', 'Yes');
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
                const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 300);
                const lowerText = cleanText ? cleanText.toLowerCase() : '';
                const combinedLabel = ariaLabel + " " + lowerText;

                const isBehavioral = combinedLabel.includes('why') || combinedLabel.includes('interest') || combinedLabel.includes('reason') || combinedLabel.includes('cover letter') || combinedLabel.includes('excite') || combinedLabel.includes('mission') || combinedLabel.includes('fit') || combinedLabel.includes('value') || combinedLabel.includes('resonate') || combinedLabel.includes('hardest') || combinedLabel.includes('impactful') || combinedLabel.includes('problem');
                const isTechnical = combinedLabel.includes('describe') || combinedLabel.includes('experience') || combinedLabel.includes('background') || combinedLabel.includes('proud') || combinedLabel.includes('impressive') || combinedLabel.includes('achievement') || combinedLabel.includes('project') || combinedLabel.includes('built') || combinedLabel.includes('workflow') || combinedLabel.includes('feature') || combinedLabel.includes('sql') || combinedLabel.includes('python') || combinedLabel.includes('skills') || combinedLabel.includes('rate your') || combinedLabel.includes('tools') || combinedLabel.includes(' ai ') || combinedLabel.includes('artificial intelligence') || combinedLabel.includes('technologies') || combinedLabel.includes('technical stack') || combinedLabel.includes('tech stack');

                if (combinedLabel.includes('years')) {
                    if (!(await area.inputValue())) { await area.fill("10"); await area.blur().catch(()=>{}); }
                } else if (isBehavioral) {
                    const interest = profileConfig?.narrative?.interest_statement || exitStory;
                    if (!(await area.inputValue())) { await area.fill(interest); await area.blur().catch(()=>{}); }
                } else if (isTechnical) {
                    if (!(await area.inputValue())) { await area.fill(exitStory); await area.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('country') && combinedLabel.includes('located')) {
                    if (!(await area.inputValue())) { await area.fill('United States'); await area.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('relocation') || combinedLabel.includes('relocate')) {
                    if (!(await area.inputValue())) { await area.fill('No'); await area.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await area.inputValue())) { await area.fill(catchAll); await area.blur().catch(()=>{}); }
                } else {
                    // Fallback: any required unfilled textarea gets catchAll
                    const isReq = await area.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                    if (isReq && !(await area.inputValue())) { 
                        await logUnmappedDom(area, "Textarea Fallback");
                        await area.fill(catchAll); 
                        await area.blur().catch(()=>{}); 
                    }
                }
            } catch(e) {}
        }
        
        // Scan custom inputs directly reading Aria labels to bypass broken parent DOM hierarchies
        const allInputs = await page.$$('input[type="text"]:not([role="combobox"]):not(.select__input):not([id*="react-select"])');
        for (const input of allInputs) {
            try {
                const ariaLabel = (await input.getAttribute('aria-label') || '').toLowerCase();
                const parentLabel = await input.$('xpath=ancestor::div[contains(@class,"field")] | ancestor::label | preceding-sibling::label').catch(()=>null);
                const text = parentLabel ? await parentLabel.textContent().catch(()=>'') : '';
                const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 300);
                const lowerText = cleanText ? cleanText.toLowerCase() : '';
                const combinedLabel = ariaLabel + " " + lowerText;
                
                const isBehavioral = combinedLabel.includes('why') || combinedLabel.includes('interest') || combinedLabel.includes('reason') || combinedLabel.includes('cover letter') || combinedLabel.includes('excite') || combinedLabel.includes('mission') || combinedLabel.includes('fit') || combinedLabel.includes('value') || combinedLabel.includes('resonate');
                const isTechnical = combinedLabel.includes('describe') || combinedLabel.includes('experience') || combinedLabel.includes('background') || combinedLabel.includes('proud') || combinedLabel.includes('impressive') || combinedLabel.includes('achievement') || combinedLabel.includes('project') || combinedLabel.includes('built') || combinedLabel.includes('workflow') || combinedLabel.includes('feature') || combinedLabel.includes('sql') || combinedLabel.includes('python') || combinedLabel.includes('skills') || combinedLabel.includes('rate your') || combinedLabel.includes('tools') || combinedLabel.includes('ai') || combinedLabel.includes('technologies');
                
                if (combinedLabel.includes('years')) {
                    if (!(await input.inputValue())) { await input.pressSequentially("10", {delay: 50}); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('salary') || combinedLabel.includes('compensation') || combinedLabel.includes('expectations') || combinedLabel.includes('package')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(minComp.toString(), { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (ariaLabel.includes('notice period') || ariaLabel.includes('available to start')) {
                    if (!(await input.inputValue())) { await input.pressSequentially("2-4 weeks", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (ariaLabel.includes('linkedin')) {
                    let li = profileConfig?.candidate?.linkedin || '';
                    if (li && !li.startsWith('http')) li = 'https://www.' + li.replace(/^www\./, '');
                    if (!(await input.inputValue())) { await input.pressSequentially(li, { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (ariaLabel.includes('website') || ariaLabel.includes('portfolio') || ariaLabel.includes('github')) {
                    const u = ariaLabel.includes('website') || ariaLabel.includes('portfolio') ? profileConfig?.candidate?.portfolio_url : profileConfig?.candidate?.github;
                    if (!(await input.inputValue())) { await input.pressSequentially(u || '', { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (ariaLabel.includes('preferred') || ariaLabel.includes('pronounce')) {
                    const name = profileConfig?.candidate?.full_name?.split(' ')[0] || "Daniel";
                    if (!(await input.inputValue())) { await input.pressSequentially(name, { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (ariaLabel.includes('title')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(profileConfig?.candidate?.title || 'Engineer', { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('first name') || combinedLabel.includes('given name')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(profileConfig?.candidate?.full_name?.split(' ')[0] || "Daniel", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('last name') || combinedLabel.includes('family name')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(profileConfig?.candidate?.full_name?.split(' ').slice(1).join(' ') || "Hardesty Lewis", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('email')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(profileConfig?.candidate?.email || "daniel@homecastr.com", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('phone') || combinedLabel.includes('mobile')) {
                    const sanitizedPhone = (profileConfig?.candidate?.phone || "7133717875").replace(/[\s\+\(\)\-]/g, '');
                    if (!(await input.inputValue())) { await input.pressSequentially(sanitizedPhone, { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('location') || combinedLabel.includes('city') || combinedLabel.includes('address')) {
                    if (!(await input.inputValue())) {
                        await input.pressSequentially("New York, NY", { delay: 15 });
                        await input.blur().catch(()=>{});
                        await page.waitForTimeout(800);
                        await input.press('ArrowDown').catch(()=>{});
                        await page.waitForTimeout(200);
                        await input.press('Enter').catch(()=>{});
                    }
                } else if (combinedLabel.includes('gpa') || combinedLabel.includes('grade')) {
                    if (!(await input.inputValue())) { await input.pressSequentially("4.0", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('company') || combinedLabel.includes('employer')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(profileConfig?.candidate?.current_company || "Stealth", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('legal name') || combinedLabel.includes('full name') || combinedLabel.includes('signature')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(profileConfig?.candidate?.full_name || "Daniel Hardesty Lewis", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('ldap') || combinedLabel.includes('employee id')) {
                    if (!(await input.inputValue())) { await input.pressSequentially("N/A", { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('willing') || combinedLabel.includes('relocate') || combinedLabel.includes('hybrid') || combinedLabel.includes('office')) {
                    if (!(await input.inputValue())) { await input.pressSequentially('Yes', { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('specify') && combinedLabel.includes('if you chose')) {
                    if (!(await input.inputValue())) { await input.pressSequentially('LinkedIn', { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('hear') || combinedLabel.includes('source') || combinedLabel.includes('find out')) {
                    if (!(await input.inputValue())) { await input.pressSequentially('LinkedIn', { delay: 20 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('cloud')) {
                    if (!(await input.inputValue())) { await input.pressSequentially('AWS, GCP, Azure', { delay: 10 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('rate') || combinedLabel.includes('1-10') || combinedLabel.includes('1 to 10')) {
                    if (!(await input.inputValue())) { await input.pressSequentially('10', { delay: 10 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('start') || combinedLabel.includes('soonest') || combinedLabel.includes('available')) {
                    if (!(await input.inputValue())) { await input.pressSequentially('Spring 2026', { delay: 15 }); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('how much experience') || combinedLabel.includes('years of experience')) {
                    if (!(await input.inputValue())) { await input.pressSequentially('10+ years', { delay: 10 }); await input.blur().catch(()=>{}); }
                } else if (isBehavioral) {
                    const interest = profileConfig?.narrative?.interest_statement || exitStory;
                    if (!(await input.inputValue())) { await input.fill(interest); await input.blur().catch(()=>{}); }
                } else if (isTechnical) {
                    if (!(await input.inputValue())) { await input.fill(exitStory); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await input.inputValue())) { await input.fill(catchAll); await input.blur().catch(()=>{}); }
                } else {
                    // Fallback: any unfilled required input gets the catchAll answer
                    const isReq = await input.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                    if (isReq && !(await input.inputValue())) { 
                        await logUnmappedDom(input, "Text Input Fallback");
                        await input.fill("N/A - See Resume"); 
                        await input.blur().catch(()=>{}); 
                    }
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
                    return ctx ? ctx.textContent.replace(/\s+/g, ' ').trim().substring(0, 300).toLowerCase() : '';
                }).catch(()=>'');

                const isExportControl = labelText.includes('cuba') || labelText.includes('iran') || labelText.includes('syria') || labelText.includes('korea') || labelText.includes('russia') || labelText.includes('belarus') || labelText.includes('export') || labelText.includes('sanctions') || labelText.includes('prior question');
                
                if (isExportControl) {
                    if (labelText.includes('none of the above') || labelText.includes('not applicable') || labelText.includes('none of these apply') || labelText.includes('u.s. citizen')) {
                        if (!(await check.isChecked())) await check.check({force: true}).catch(()=>{});
                    }
                } else if (name.includes('gdpr') || name.includes('consent') || name.includes('terms') || name.includes('agree') || labelText.includes('agree') || labelText.includes('confirm') || labelText.includes('certify') || labelText.includes('acknowledge') || labelText.includes('understand') || labelText.includes('policy') || labelText.includes('consent')) {
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
                    await logUnmappedDom(group.first(), "Radio Required Catch-All");
                    const count = await group.count();
                    let clickIndex = 0;
                    for (let i = 0; i < count; i++) {
                        const lbl = await group.nth(i).evaluate(el => (el.closest('label') || el.parentElement)?.textContent?.toLowerCase() || '');
                        if (lbl.includes('no ') || lbl === 'no' || lbl.includes("don't") || lbl.includes("not")) clickIndex = i;
                    }
                    await group.nth(clickIndex).check({force: true}).catch(()=>{});
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

    console.log("Generating Submission State Snapshot...");
    try {
        const applicationSnapshot = await page.evaluate(() => {
            const data = {};
            // Extract standard inputs
            document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
                const label = document.querySelector(`label[for="${input.id}"]`)?.innerText || input.name || input.id;
                data[label.trim()] = input.value;
            });

            // Extract React Selects (Comboboxes)
            document.querySelectorAll('input[role="combobox"]').forEach(box => {
                let label = document.querySelector(`label[for="${box.id}"]`)?.innerText;
                if (!label) {
                    const ctx = box.closest('div.field, .application-question');
                    if (ctx) label = ctx.innerText.split('\n')[0];
                }
                label = label || box.id;
                const container = box.closest('div[class*="container"]');
                const selectedValue = container?.querySelector('[class*="single-value"]')?.innerText || box.value;
                data[label.trim()] = selectedValue || "Unanswered";
            });

            // Extract Native Selects
            document.querySelectorAll('select').forEach(select => {
                const label = document.querySelector(`label[for="${select.id}"]`)?.innerText || select.name || select.id;
                const selectedText = select.options[select.selectedIndex]?.text || "Unanswered";
                data[label.trim()] = selectedText;
            });

            // Extract Checkboxes and Radio Buttons
            document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(box => {
                if (box.checked) {
                    const label = document.querySelector(`label[for="${box.id}"]`)?.innerText || box.parentElement?.innerText || box.id;
                    data[label.trim()] = "Checked";
                }
            });

            return data;
        });
        metrics.snapshot = applicationSnapshot;
        metrics.domain = domain;
        
        // Extract raw HTML context of the form to aid deterministic debugging of unmapped fields
        metrics.rawFormHtml = await page.locator('form').first().evaluate(el => el.outerHTML).catch(()=>'');
    } catch(e) {
        console.error("Failed to generate application snapshot", e);
    }

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
                        const { waitForVerificationCode } = await import('file:///' + path.resolve('src/scrapers/email-interceptor.mjs').replace(/\\/g, '/'));
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
        if (process.env.MULTI_TAB !== 'true') {
            await page.pause();
        } else {
            console.log("MULTI_TAB mode enabled. Leaving tab open natively.");
        }
    }

}




import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    (async () => {
        const isBatch = process.env.BATCH_EVAL_MODE === 'true';
        const targetUrl = process.argv[2];
        const targetResumeUrl = process.argv[3] || 'cv.pdf';
        
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






