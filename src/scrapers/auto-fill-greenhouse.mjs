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
                    spawnSync('node', [path.resolve('src/generator/generate-cover-letter.mjs')], { stdio: 'inherit' });
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
                if (await el.count() > 0) await el.first().pressSequentially(val, { delay: Math.floor(Math.random() * 40) + 20 });
            }
        }
    } catch(e) {}

    console.log("Attaching Resume natively...");
    try {
        // Universal FileChooser Approach for modern React Greenhouse apps
        const attachBtn = page.locator('button:has-text("Attach"), button:has-text("Upload"), .button-upload, button[data-source="attach"], a[data-source="attach"]').first();
        
        let fileChooserTriggered = false;
        if (await attachBtn.count() > 0) {
            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null),
                attachBtn.click({ force: true }).catch(() => {})
            ]);
            
            if (fileChooser) {
                await fileChooser.setFiles(path.resolve(resumePath));
                console.log("✅ Resume attached via native FileChooser popup.");
                fileChooserTriggered = true;
            }
        }
        
        if (!fileChooserTriggered) {
            await page.waitForSelector('input[type="file"]', { timeout: 8000 }).catch(() => {});
            
            // Try all known Greenhouse file input selectors in priority order
            let fileInput = page.locator('#resume_upload');
            if (await fileInput.count() === 0) fileInput = page.locator('input[type="file"][id="resume"]');
            if (await fileInput.count() === 0) fileInput = page.locator('input[type="file"][name="resume"]');
            if (await fileInput.count() === 0) fileInput = page.locator('input[type="file"]').first();
            
            if (await fileInput.count() > 0) {
                await fileInput.setInputFiles(path.resolve(resumePath));
                await fileInput.evaluate(node => {
                    const tracker = node._valueTracker;
                    if (tracker) tracker.setValue(node.value);
                    node.dispatchEvent(new Event('change', { bubbles: true }));
                }).catch(()=>{});
                console.log("✅ Resume attached natively via input override.");
            } else {
                console.log("❌ Could not locate Greenhouse file input structure.");
            }
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
                await clInputs.first().evaluate(node => {
                    const tracker = node._valueTracker;
                    if (tracker) tracker.setValue(node.value);
                    node.dispatchEvent(new Event('change', { bubbles: true }));
                }).catch(()=>{});
                console.log("✅ Cover letter explicit attachment found.");
            } else {
                const genericFileInputs = page.locator('input[type="file"]');
                if (await genericFileInputs.count() > 1) {
                    await genericFileInputs.nth(1).setInputFiles(clPath);
                    await genericFileInputs.nth(1).evaluate(node => {
                        const tracker = node._valueTracker;
                        if (tracker) tracker.setValue(node.value);
                        node.dispatchEvent(new Event('change', { bubbles: true }));
                    }).catch(()=>{});
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
    await safeFill('#first_name, input[id*="first_name"], input[name*="first_name"]', profileConfig?.candidate?.first_name || 'Daniel');
    await safeFill('#last_name, input[id*="last_name"], input[name*="last_name"]', profileConfig?.candidate?.last_name || 'Hardesty Lewis');
    await safeFill('#email, input[id*="email"], input[name*="email"], input[type="email"]', profileConfig?.candidate?.email || 'daniel@homecastr.com');
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

    // -------------------------------------------------------------------------
    // MASTER STRATEGY MAPPER 
    // -------------------------------------------------------------------------
    console.log("Executing Deterministic Strategy Mapper...");

    const fillDeterministicField = async (page, questionRegex, targetValue) => {
        try {
            const isMatchOption = (optText, targetValue) => {
                const lowerOpt = optText.toLowerCase().trim();
                const lowerTarget = targetValue.toLowerCase().trim();
                
                // Protect against "female" matching "male"
                if (lowerTarget === 'male' && lowerOpt.includes('female')) return false;
                if (lowerTarget === 'man' && lowerOpt.includes('woman')) return false;
                
                let isMatch = lowerOpt === lowerTarget || lowerOpt.startsWith(lowerTarget) || lowerOpt.includes(lowerTarget);
                if (!isMatch && lowerTarget.includes('texas at austin')) {
                    isMatch = lowerOpt.includes('texas at austin') || lowerOpt.includes('texas - austin') || lowerOpt.includes('texas, austin');
                }
                if (!isMatch && lowerTarget === 'decline') {
                    isMatch = lowerOpt.includes('prefer not') || lowerOpt.includes('decline') || lowerOpt.includes('do not wish');
                }
                if (!isMatch && lowerTarget === 'none') {
                    isMatch = lowerOpt.includes('not applicable');
                }
                if (!isMatch && lowerTarget === 'now') {
                    isMatch = lowerOpt.includes('immediately');
                }
                if (!isMatch && lowerTarget === 'yes' && lowerOpt.includes('acknowledge')) isMatch = true;
                return isMatch;
            };

            // Find all labels, filter by text
            const labels = await page.$$('label');
            let targetLabel = null;
            let targetId = null;

            for (const lbl of labels) {
                const text = (await lbl.textContent() || '').trim();
                if (questionRegex.test(text)) {
                    let tempId = await lbl.getAttribute('for');
                    if (!tempId) {
                        const idAttr = await lbl.getAttribute('id');
                        if (idAttr && idAttr.endsWith('-label')) {
                            tempId = idAttr.replace('-label', '');
                        }
                    }
                    if (!tempId) {
                        const nestedInput = await lbl.$('input, select, textarea');
                        if (nestedInput) tempId = await nestedInput.getAttribute('id');
                    }
                    if (!tempId) continue;
                    
                    const safeId = tempId.replace(/([":\[\]\.\,])/g, '\\$1');
                    const inputCheck = page.locator(`[id="${safeId}"]`).first();
                    const isVis = await inputCheck.isVisible().catch(()=>false);
                    const typeAttr = await inputCheck.getAttribute('type').catch(()=>null);
                    
                    const hasAdjacentSelect = await lbl.evaluate(el => {
                        const parent = el.parentElement;
                        return parent && parent.querySelector('.select__control, .select2-container, div[class*="select"]') !== null;
                    }).catch(()=>false);
                    
                    if (isVis || typeAttr === 'hidden' || hasAdjacentSelect) {
                        targetLabel = lbl;
                        targetId = tempId;
                        console.log(`[Mapper] Matched Regex ${questionRegex} against Label: "${text.substring(0, 30)}..." -> TargetID: ${targetId}`);
                        break;
                    }
                }
            }

            if (!targetId) return false;

            // Use locator with ID because IDs might have weird characters in modern react
            const safeId = targetId.replace(/([":\[\]\.\,])/g, '\\$1');
            let input = page.locator(`[id="${safeId}"]`).first();
            
            // Check if it's a hidden React-Select input or base ID doesn't exist
            if (await input.count() === 0 || await input.getAttribute('type') === 'hidden') {
                // Try dynamically generated react-select IDs first
                const reactSelectInput = page.locator(`#react-select-${safeId}-input`).first();
                if (await reactSelectInput.count() > 0) {
                    input = reactSelectInput;
                    console.log(`[Mapper] Redirected ID ${targetId} to React-Select input (#react-select-${safeId}-input)`);
                } else {
                    // Fallback to finding the input visually adjacent to the label
                    const siblingInput = page.locator(`label[for="${safeId}"] ~ div input, label[for="${safeId}"] + div input`).first();
                    if (await siblingInput.count() > 0) {
                        input = siblingInput;
                        console.log(`[Mapper] Redirected ID ${targetId} to adjacent div input`);
                    } else if (await input.count() === 0) {
                        console.log(`[Mapper] Failed to find input with ID: ${targetId}`);
                        return false;
                    }
                }
            }

            const tagName = await input.evaluate(el => el.tagName.toLowerCase());
            const role = await input.getAttribute('role');
            const type = (await input.getAttribute('type')) || 'text';
            
            console.log(`[Mapper] Processing ID: ${targetId} | Tag: ${tagName} | Role: ${role} | Type: ${type}`);

            if (tagName === 'input' && role === 'combobox') {
                // Strategy: React-Select
                await input.evaluate(el => {
                    el.style.opacity = "1";
                    el.style.position = "static";
                    el.style.display = "block";
                    el.style.width = "auto";
                });
                await input.focus({ force: true }).catch(()=>{});
                await input.fill("").catch(()=>{});
                
                // If target is Decline or Acknowledge, don't filter aggressively because the literal text varies
                const searchStr = ['decline', 'acknowledge', 'expert', 'proficient'].includes(targetValue.toLowerCase()) ? ' ' : targetValue;
                
                await input.pressSequentially(searchStr, { delay: 50 }).catch(()=>{});
                await page.waitForTimeout(2000); // Wait for options to render from API
                
                // Try to click the exact option
                let options = await page.$$('div[class*="option"]');
                
                // Fallback: If no options, clear and open dropdown manually
                if (options.length === 0) {
                    await input.fill("").catch(()=>{});
                    await input.press('ArrowDown').catch(()=>{});
                    await page.waitForTimeout(1000);
                    options = await page.$$('div[class*="option"]');
                }
                
                let clicked = false;
                const returnedOptions = [];
                for (const opt of options) {
                    const optText = await opt.innerText().catch(()=>'');
                    if (optText.trim()) returnedOptions.push(optText.trim());
                    
                    if (isMatchOption(optText, targetValue)) {
                        console.log(`[Mapper] React-Select: Searched "${targetValue}", Selected: "${optText.trim()}"`);
                        await opt.click({ delay: 50, force: true }).catch(()=>{});
                        clicked = true;
                        break;
                    }
                }
                if (!clicked) {
                    const previewOptions = returnedOptions.slice(0, 5).join(', ') + (returnedOptions.length > 5 ? '...' : '');
                    console.log(`[Mapper] React-Select: Searched "${targetValue}", No exact match found. Returned options: [${previewOptions}]. Pressing Enter as fallback.`);
                    await input.press('Enter').catch(()=>{});
                }
                await page.waitForTimeout(300);
                await input.press('Tab').catch(()=>{}); // Blur the input so React state flushes
                return true;

            } else if (tagName === 'select') {
                // Strategy: Native Select or Select2
                const isSelect2 = await input.evaluate(el => el.classList.contains('select2-hidden-accessible') || (el.nextElementSibling && el.nextElementSibling.classList.contains('select2')));
                
                if (isSelect2) {
                    console.log(`[Mapper] Detected Select2 for ID: ${targetId}`);
                    // Click the select2 container to open the dropdown
                    await input.evaluate(el => {
                        const container = el.nextElementSibling;
                        if (container) {
                            const selection = container.querySelector('.select2-selection');
                            if (selection) selection.click();
                        }
                    }).catch(()=>{});
                    
                    await page.waitForTimeout(500);
                    
                    // Type into the active search field (Select2 appends this to the body usually)
                    const searchField = page.locator('input.select2-search__field').last();
                    if (await searchField.isVisible().catch(()=>false)) {
                        await searchField.fill("");
                        await searchField.pressSequentially(targetValue, { delay: 50 });
                        await page.waitForTimeout(2000); // Wait for AJAX API to fetch options
                        
                        // Explicitly find the best matching option and click it
                        const options = await page.$$('li.select2-results__option');
                        let clicked = false;
                        const returnedOptions = [];
                        
                        for (const opt of options) {
                            const text = await opt.innerText().catch(()=>'');
                            if (text.trim()) returnedOptions.push(text.trim());
                        }

                        for (const opt of options) {
                            const text = await opt.innerText().catch(()=>'');
                            if (isMatchOption(text, targetValue)) {
                                console.log(`[Mapper] Select2: Searched "${targetValue}", Selected exact/partial match: "${text.trim()}"`);
                                await opt.click().catch(()=>{});
                                clicked = true;
                                break;
                            }
                        }
                        
                        if (!clicked && options.length > 0) {
                            // If no text match but options exist, select the first one
                            const previewOptions = returnedOptions.slice(0, 5).join(', ') + (returnedOptions.length > 5 ? '...' : '');
                            console.log(`[Mapper] Select2: Searched "${targetValue}", No match found. Returned options: [${previewOptions}]. Selecting first: "${returnedOptions[0]}"`);
                            await options[0].click().catch(()=>{});
                        } else if (!clicked) {
                            console.log(`[Mapper] Select2: Searched "${targetValue}", No options returned. Pressing Enter as fallback.`);
                            await searchField.press('Enter').catch(()=>{});
                        }
                        
                        await page.waitForTimeout(300);
                        await input.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
                        return true;
                    } else {
                        // If no search field, try to click a matching option directly
                        const options = await page.$$('li.select2-results__option');
                        for (const opt of options) {
                            const text = await opt.innerText().catch(()=>'');
                            if (isMatchOption(text, targetValue)) {
                                console.log(`[Mapper] Select2 (No Search Field): Selected "${text.trim()}"`);
                                await opt.click().catch(()=>{});
                                await page.waitForTimeout(300);
                                await input.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
                                return true;
                            }
                        }
                    }
                }

                // Normal Native Select fallback
                const options = await input.evaluate(el => Array.from(el.options).map(o => o.textContent.trim()));
                let match = options.find(o => o && o.toLowerCase().includes(targetValue.toLowerCase()));
                if (!match && targetValue === 'I am authorized') {
                     match = options.find(o => o && o.toLowerCase().includes('yes'));
                }
                if (!match && targetValue === 'Yes') match = options.find(o => o && o.toLowerCase().includes('acknowledge'));
                if (!match && targetValue === 'Yes') match = options.find(o => o && o.toLowerCase().includes('authorized'));
                
                if (match) {
                    console.log(`[Mapper] Native Select: Selected "${match}" for ID: ${targetId}`);
                    await input.selectOption({ label: match }, { force: true }).catch(()=>{});
                    await input.evaluate(node => {
                        const tracker = node._valueTracker;
                        if (tracker) tracker.setValue(node.value);
                        node.dispatchEvent(new Event('change', { bubbles: true }));
                    }).catch(()=>{});
                    await page.waitForTimeout(200);
                    return true;
                }
            } else if ((tagName === 'input' && ['text', 'tel', 'email', 'url', 'number', 'password'].includes(type.toLowerCase())) || tagName === 'textarea') {
                // Strategy: Text Input
                // Protect against mapping "Yes"/"No" to textareas
                if (tagName === 'textarea' && (targetValue === 'Yes' || targetValue === 'No' || targetValue === 'check' || targetValue === 'uncheck')) {
                    return false;
                }
                
                if (!(await input.inputValue())) {
                    await input.focus().catch(()=>{});
                    await input.pressSequentially(targetValue, { delay: 15 }).catch(()=>{});
                    await page.waitForTimeout(500);
                    // Google Maps Autocomplete Check
                    const autocomplete = page.locator('.pac-container .pac-item, ul.ui-autocomplete li.ui-menu-item').first();
                    if (await autocomplete.isVisible().catch(()=>false)) {
                        await autocomplete.click().catch(()=>{});
                        await page.waitForTimeout(300);
                    }
                    await input.blur().catch(()=>{});
                    return true;
                }
            } else if (tagName === 'input' && (type === 'radio' || type === 'checkbox')) {
                const targetLower = targetValue.toString().toLowerCase();
                if (targetLower === 'check' || targetLower === 'yes' || targetLower === 'true' || targetLower === 'acknowledge') {
                    if (!(await input.isChecked().catch(()=>false))) {
                        await input.check({ force: true }).catch(()=>{});
                        await input.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
                        return true;
                    }
                } else if (targetLower === 'uncheck' || targetLower === 'no' || targetLower === 'false') {
                    if (await input.isChecked().catch(()=>false)) {
                        await input.uncheck({ force: true }).catch(()=>{});
                        await input.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
                        return true;
                    }
                } else {
                    // The targetValue is a string (like 'Decline', 'Male', etc.), and this is a radio array.
                    // We need to find the correct radio button in this field container.
                    const fieldContainer = await input.evaluateHandle(el => el.closest('.application-field, .application-question')).catch(()=>null);
                    if (fieldContainer) {
                        const labels = await fieldContainer.$$('label');
                        for (const lbl of labels) {
                            const text = await lbl.innerText().catch(()=>'');
                            if (isMatchOption(text, targetValue)) {
                                const radio = await lbl.$('input[type="radio"], input[type="checkbox"]');
                                if (radio) {
                                    if (!(await radio.isChecked().catch(()=>false))) {
                                        await radio.check({ force: true }).catch(()=>{});
                                        await radio.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true }))).catch(()=>{});
                                    }
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        } catch(e) {}
        return false;
    };

    const DETERMINISTIC_MAPPINGS = [
        { question: /linkedin profile/i, value: profileConfig?.candidate?.linkedin || 'https://linkedin.com/in/dhardestylewis' },
        { question: /github/i, value: profileConfig?.candidate?.github || 'https://github.com/dhardestylewis' },
        { question: /website|portfolio/i, value: profileConfig?.candidate?.portfolio || 'https://dlewis.ai' },
        { question: /work authorization|authorized to work|right to work|eligibility/i, value: 'Yes' },
        { question: /require.*sponsorship|need sponsorship|require visa/i, value: 'No' },
        { question: /gender/i, value: domainOverrides.gender || 'Male' },
        { question: /hispanic|latino/i, value: 'Decline' },
        { question: /racial|ethnic/i, value: 'Decline' },
        { question: /sexual orientation/i, value: 'Decline' },
        { question: /transgender/i, value: 'Decline' },
        { question: /veteran/i, value: 'No' },
        { question: /disability/i, value: 'No' },
        { question: /^country\b/i, value: domainOverrides.country || 'United States' },
        { question: /address|mailing address/i, value: '155 Claremont Ave, New York, NY 10027' },
        { question: /how did you.*hear|find out/i, value: 'LinkedIn' },
        { question: /pronoun/i, value: 'He/him' },
        { question: /salary.*expect|compensation/i, value: '$200,000+' },
        { question: /^degree\b|highest level of education/i, value: 'Bachelor' },
        { question: /^discipline\b|highest level degree in/i, value: 'Computer Science' },
        { question: /^school\b/i, value: 'Concordia University Texas' },
        { question: /start date year|start year/i, value: '2012' },
        { question: /end date year|end year|graduation year/i, value: '2018' },
        { question: /^(?!.*(?:russia|belarus)).*(?:comfortable with this requirement|hybrid|onsite|relocat)/i, value: 'Yes' },
        { question: /do you have.*experience|years.*experience|experience with|familiar with|experience using|experience working/i, value: 'Yes' },
        { question: /quebec/i, value: 'No' },
        { question: /data privacy notice/i, value: 'Acknowledge' },
        { question: /recording.*interview|record.*formats/i, value: 'Acknowledge' },
        { question: /please specify here/i, value: 'N/A' },
        { question: /^are you a current.*employee/i, value: 'No' },
        { question: /current.*company|current firm|most recent company/i, value: profileConfig?.candidate?.company || 'Homecastr' },
        { question: /preferred programming language/i, value: 'Python' },
        { question: /past 6 months|previously applied|previously worked|worked for.*before|former.*employee/i, value: 'No' },
        { question: /18\+ years of age|18 or older/i, value: 'Yes' },
        { question: /available to work as a full|soonest you can start|earliest.*start/i, value: 'Now' },
        { question: /technical skills/i, value: 'Expert' },
        { question: /gpa.*undergraduate|undergraduate gpa/i, value: '3.4' },
        { question: /gpa.*graduate|graduate gpa/i, value: 'Not applicable' },
        { question: /gpa.*doctorate|doctorate gpa/i, value: 'Not applicable' },
        { question: /sat score/i, value: 'Not applicable' },
        { question: /act score/i, value: 'Not applicable' },
        { question: /gre score/i, value: 'Not applicable' },
        { question: /security clearance/i, value: 'None' },
        { question: /spacex employment/i, value: 'No' },
        { question: /accommodations/i, value: 'Yes' },
        { question: /citizenship status/i, value: 'U.S. Citizen' },
        { question: /type of visa sponsorship/i, value: 'None' },
        { question: /phd/i, value: 'No' },
        { question: /indian national/i, value: 'No' },
        { question: /working status in india/i, value: 'Not applicable' },
        { question: /restrict your ability to work|non-compete/i, value: 'No' },
        { question: /preferred first name/i, value: profileConfig?.candidate?.first_name || 'Daniel' },
        { question: /legal name/i, value: (profileConfig?.candidate?.first_name || 'Daniel') + ' ' + (profileConfig?.candidate?.last_name || 'Hardesty Lewis') },
        { question: /^first name/i, value: profileConfig?.candidate?.first_name || 'Daniel' },
        { question: /^last name/i, value: profileConfig?.candidate?.last_name || 'Hardesty Lewis' },
        { question: /^email/i, value: profileConfig?.candidate?.email || 'daniel.hardestylewis@gmail.com' },
        { question: /school|university/i, value: domainOverrides.school || profileConfig?.candidate?.university || 'University of Texas at Austin' },
        { question: /^degree/i, value: domainOverrides.degree || profileConfig?.candidate?.degree || 'Bachelor' },
        { question: /discipline|what is your major/i, value: domainOverrides.discipline || profileConfig?.candidate?.major || 'Mathematics' },
        { question: /gpa|grade/i, value: profileConfig?.candidate?.gpa || '3.49' },
        { question: /pronouns/i, value: profileConfig?.candidate?.pronouns || 'He/him' },
        { question: /^location \(city\)|^city/i, value: profileConfig?.candidate?.location || 'New York, NY' },
        { question: /privacy policy|acknowledge|outside assistance|artificial intelligence/i, value: 'acknowledge' },
        { question: /where do you intend to work/i, value: profileConfig?.candidate?.location || 'New York, NY' },
        { question: /currently based in|live in/i, value: 'Yes' },
        { question: /clearance/i, value: 'No' },
        { question: /NeurIPS|ICML|CVPR/i, value: 'check' },
        { question: /^Generative AI|^Natural Language Processing|Recommendation Systems/i, value: 'check' },
        { question: /google scholar/i, value: profileConfig?.candidate?.scholar || 'https://scholar.google.com/citations?user=Gk740W4AAAAJ' },
        { question: /why applied intuition/i, value: 'I am highly motivated by frontier research and building applied AI systems that solve tangible, high-impact problems.' },
        { question: /hardest thing you’ve done/i, value: 'Architecting and scaling the data aggregation and real-time inference pipeline for a national real estate prediction model completely solo. Ensuring fault-tolerance and sub-second latency across millions of rows of data required mastering completely new distributed systems paradigms on the fly.' },
        { question: /highest quality work of your life/i, value: 'Building the state-of-the-art property valuation model at Homecastr. It represents the culmination of my experience in ML, systems engineering, and geospatial data, beating commercial benchmarks while operating efficiently at scale.' },
        { question: /steps did you take to become the best/i, value: 'Relentless curiosity, diving into research papers to understand the mathematical foundations of models rather than treating them as black boxes, and consistently building end-to-end systems from infrastructure to inference to understand the holistic lifecycle of a product.' },
        { question: /^none of the above$/i, value: 'check' },
        { question: /not applicable.*selected.*none of the above/i, value: 'check' },
        { question: /notice period/i, value: 'Available immediately' }
    ];

    for (const map of DETERMINISTIC_MAPPINGS) {
        await fillDeterministicField(page, map.question, map.value);
    }

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
                const parentLabel = await area.evaluateHandle(el => {
                    const id = el.id;
                    if (id) {
                        const lbl = document.querySelector(`label[for="${id}"]`) || document.querySelector(`label[for="${id.replace('form_', '')}"]`);
                        if (lbl) return lbl;
                    }
                    const aria = el.getAttribute('aria-labelledby');
                    if (aria) {
                        const lbl = document.getElementById(aria);
                        if (lbl) return lbl;
                    }
                    const wrap = el.closest('div[class*="question"]');
                    if (wrap) return wrap;
                    const field = el.closest('.field');
                    if (field && field.querySelectorAll('input, textarea, select').length <= 3) return field;
                    return el.parentElement;
                }).catch(()=>null);
                
                const text = parentLabel ? await parentLabel.textContent().catch(()=>'') : '';
                const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 300);
                const lowerText = cleanText ? cleanText.toLowerCase() : '';
                const placeholder = (await area.getAttribute('placeholder') || '').toLowerCase();
                const combinedLabel = ariaLabel + " " + placeholder + " " + lowerText;

                const isBehavioral = /\b(why|interest\w*|reason\w*|cover letter|excit\w*|mission|fit|value\w*|resonate\w*)\b/i.test(combinedLabel);
                const isTechnical = /\b(describe|experience|background|proud|impressive|achievement|project|built|workflow|feature|sql|python|skills|rate your|tools|ai|artificial intelligence|technologies)\b/i.test(combinedLabel);

                if (combinedLabel.includes('years')) {
                    if (!(await area.inputValue())) { await area.pressSequentially("10", { delay: Math.floor(Math.random() * 40) + 20 }); await area.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await area.inputValue())) { await area.pressSequentially(catchAll, { delay: Math.floor(Math.random() * 40) + 20 }); await area.blur().catch(()=>{}); }
                } else if (isBehavioral) {
                    const interest = profileConfig?.narrative?.interest_statement || exitStory;
                    if (!(await area.inputValue())) { await area.pressSequentially(interest, { delay: Math.floor(Math.random() * 40) + 20 }); await area.blur().catch(()=>{}); }
                } else if (isTechnical) {
                    if (!(await area.inputValue())) { await area.pressSequentially(exitStory, { delay: Math.floor(Math.random() * 40) + 20 }); await area.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('country') && combinedLabel.includes('located')) {
                    if (!(await area.inputValue())) { await area.pressSequentially('United States', { delay: Math.floor(Math.random() * 40) + 20 }); await area.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('relocation') || combinedLabel.includes('relocate')) {
                    if (!(await area.inputValue())) { await area.pressSequentially('No', { delay: Math.floor(Math.random() * 40) + 20 }); await area.blur().catch(()=>{}); }
                } else {
                    // Fallback: any required unfilled textarea gets catchAll
                    const isReq = await area.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                    if (isReq && !(await area.inputValue())) { 
                        await logUnmappedDom(area, "Textarea Fallback");
                        await area.pressSequentially(catchAll, { delay: Math.floor(Math.random() * 40) + 20 }); 
                        await area.blur().catch(()=>{}); 
                    }
                }
            } catch(e) {}
        }
        
        // Scan custom inputs directly reading Aria labels to bypass broken parent DOM hierarchies
        const allInputs = await page.$$('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([role="combobox"]):not(.select__input):not([id*="react-select"])');
        for (const input of allInputs) {
            try {
                const ariaLabel = (await input.getAttribute('aria-label') || '').toLowerCase();
                const placeholder = (await input.getAttribute('placeholder') || '').toLowerCase();
                const parentLabel = await input.evaluateHandle(el => {
                    const id = el.id;
                    if (id) {
                        const lbl = document.querySelector(`label[for="${id}"]`) || document.querySelector(`label[for="${id.replace('form_', '')}"]`);
                        if (lbl) return lbl;
                    }
                    const aria = el.getAttribute('aria-labelledby');
                    if (aria) {
                        const lbl = document.getElementById(aria);
                        if (lbl) return lbl;
                    }
                    const wrap = el.closest('div[class*="question"]');
                    if (wrap) return wrap;
                    const field = el.closest('.field');
                    if (field && field.querySelectorAll('input, textarea, select').length <= 3) return field;
                    return el.parentElement;
                }).catch(()=>null);
                
                const text = parentLabel ? await parentLabel.textContent().catch(()=>'') : '';
                const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 300);
                const lowerText = cleanText ? cleanText.toLowerCase() : '';
                const combinedLabel = ariaLabel + " " + placeholder + " " + lowerText;
                
                const isBehavioral = /\b(why|interest\w*|reason\w*|cover letter|excit\w*|mission|fit|value\w*|resonate\w*)\b/i.test(combinedLabel);
                const isTechnical = /\b(describe|experience|background|proud|impressive|achievement|project|built|workflow|feature|sql|python|skills|rate your|tools|ai|artificial intelligence|technologies)\b/i.test(combinedLabel);
                
                if (combinedLabel.includes('years')) {
                    if (!(await input.inputValue())) { await input.pressSequentially("10", {delay: 50}); await input.blur().catch(()=>{}); }
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await input.inputValue())) { await input.pressSequentially(catchAll, { delay: Math.floor(Math.random() * 40) + 20 }); await input.blur().catch(()=>{}); }
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
                    if (!(await input.inputValue())) { await input.pressSequentially(interest, { delay: Math.floor(Math.random() * 40) + 20 }); await input.blur().catch(()=>{}); }
                } else if (isTechnical) {
                    if (!(await input.inputValue())) { await input.pressSequentially(exitStory, { delay: Math.floor(Math.random() * 40) + 20 }); await input.blur().catch(()=>{}); }
                } else {
                    // Fallback: any unfilled required input gets the catchAll answer
                    const isReq = await input.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                    if (isReq && !(await input.inputValue())) { 
                        await logUnmappedDom(input, "Text Input Fallback");
                        await input.pressSequentially("N/A - See Resume", { delay: Math.floor(Math.random() * 40) + 20 }); 
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
                    const id = el.id;
                    if (id) {
                        const safeId = id.replace(/([":\[\]\.\,])/g, '\\$1');
                        const lbl = document.querySelector(`label[for="${safeId}"]`) || document.querySelector(`label[for="${safeId.replace('form_', '')}"]`);
                        if (lbl) return lbl.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
                    }
                    const ctx = el.closest('label') || el.parentElement;
                    return ctx ? ctx.textContent.replace(/\s+/g, ' ').trim().substring(0, 300).toLowerCase() : '';
                }).catch(()=>'');
                
                const questionText = await check.evaluate(el => {
                    const desc = el.getAttribute('description');
                    if (desc) return desc.toLowerCase();
                    const block = el.closest('.field, .application-question, div[class*="question"]');
                    return block ? block.textContent.replace(/\s+/g, ' ').trim().toLowerCase() : '';
                }).catch(()=>'');

                const isExportControl = questionText.includes('cuba') || questionText.includes('iran') || questionText.includes('syria') || questionText.includes('korea') || questionText.includes('russia') || questionText.includes('belarus') || questionText.includes('export controls') || questionText.includes('sanctions') || questionText.includes('prior question');
                
                if (isExportControl) {
                    if (labelText.includes('none of the above') || labelText.includes('not applicable') || labelText.includes('none of these apply')) {
                        if (!(await check.isChecked())) await check.check({force: true}).catch(()=>{});
                    } else if (labelText.includes('u.s. citizen') && !questionText.includes('prior question')) {
                        // Only check U.S. citizen if 'not applicable' isn't available
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
                if (txt && !(await txt.inputValue())) await txt.pressSequentially(minComp.toString(), { delay: Math.floor(Math.random() * 40) + 20 });
            }

            // Heuristic 3: Cover Letter analogues / Why us / Interest / Achievements / Projects
            if (lowerText.includes('why') || lowerText.includes('interest') || lowerText.includes('reason') || lowerText.includes('cover letter') || lowerText.includes('achievement') || lowerText.includes('project') || lowerText.includes('visa')) {
                const area = await block.$('textarea');
                if (area && !(await area.inputValue())) await area.pressSequentially(exitStory, { delay: Math.floor(Math.random() * 40) + 20 });
            }

            // Heuristic 4: Clearance 
            if (lowerText.includes('clearance')) {
                const t = await block.$('input[type="text"]');
                if (t && !(await t.inputValue())) await t.pressSequentially("None", { delay: Math.floor(Math.random() * 40) + 20 });
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
                        await inp.pressSequentially(yoe.toString(), { delay: Math.floor(Math.random() * 40) + 20 }).catch(()=>{});
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
    // DYNAMIC LLM SYNTHESIZER FALLBACK
    // -------------------------------------------------------------------------
    console.log("Analyzing empty fields for LLM Synthesizer Fallback...");
    try {
        const emptyFields = await page.evaluate(() => {
            const empty = [];
            const fields = document.querySelectorAll('input[type="text"]:not([type="hidden"]), textarea');
            for (const el of fields) {
                if (!el.value || el.value.trim() === '') {
                    // Try to find its label
                    let labelText = '';
                    const id = el.id;
                    if (id) {
                        const lbl = document.querySelector(`label[for="${id}"]`);
                        if (lbl) labelText = lbl.textContent.trim();
                    }
                    if (!labelText && el.getAttribute('aria-label')) labelText = el.getAttribute('aria-label');
                    if (!labelText && el.placeholder) labelText = el.placeholder;
                    if (!labelText && el.closest('label')) labelText = el.closest('label').textContent.trim();
                    
                    if (labelText) {
                        empty.push({ id: id || Math.random().toString(36).substring(7), label: labelText });
                        // tag element with tracking id if none
                        if (!id) el.setAttribute('data-llm-id', empty[empty.length-1].id);
                    }
                }
            }
            return empty;
        });

        if (emptyFields.length > 0) {
            console.log(`[LLM] Discovered ${emptyFields.length} unmapped fields. Triggering Synthesizer...`);
            const { synthesizeAnswers } = await import('file:///' + process.cwd().replace(/\\/g, '/') + '/src/generator/llm-synthesizer.mjs');
            const jdHtml = await page.locator('#content, #header, body').first().innerText().catch(()=>'');
            const synthesizedMap = await synthesizeAnswers(emptyFields, jdHtml, profileConfig);
            
            for (const q of emptyFields) {
                if (synthesizedMap[q.id]) {
                    console.log(`[LLM] Injecting synthesized answer for: "${q.label.substring(0,30)}..."`);
                    const loc = q.id.includes('.') ? page.locator(`[data-llm-id="${q.id}"]`) : page.locator(`#${q.id.replace(/([\[\]\.\,])/g, '\\$1')}, [data-llm-id="${q.id}"]`);
                    if (await loc.count() > 0) {
                        await loc.first().pressSequentially(synthesizedMap[q.id], { delay: Math.floor(Math.random() * 40) + 20 });
                    }
                }
            }
        }
    } catch (e) {
        console.error("⚠️ Synthesizer Fallback Error:", e.message);
    }

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
                let labelText = '';
                const idAttr = el.id;
                if (idAttr) {
                    try {
                        const safeId = idAttr.replace(/([\[\]\.\,])/g, '\\$1');
                        const labelEl = document.querySelector(`label[for="${safeId}"]`) || document.querySelector(`label[id="${safeId}-label"]`);
                        if (labelEl) labelText = labelEl.textContent.trim();
                    } catch (e) {}
                }
                if (!labelText) {
                    const parentLabel = el.closest('label');
                    if (parentLabel) labelText = parentLabel.textContent.trim();
                }
                
                const prefix = labelText ? `[Label: ${labelText}] ` : '';
                missingDOM.push(prefix + container.outerHTML.substring(0, 1500));
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
        if (false /* auto-submit override */) {
            console.log('Skipping submission natively: Fill criteria not met (' + metrics.fillPercentage + '%).');
            metrics.status = 'Incomplete';
            return metrics;
        }
        if (false /* auto-submit override */) {
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
                
                // Verification & Audit Screenshot
                try {
                    const fs = await import('fs');
                    if (!fs.existsSync('data/archive')) fs.mkdirSync('data/archive', { recursive: true });
                    const screenshotPath = `data/archive/submission_${Date.now()}.png`;
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                    console.log(`📸 Pre-submission audit snapshot saved: ${screenshotPath}`);
                } catch(e) {
                    console.log(`⚠️ Failed to capture pre-submission snapshot: ${e.message}`);
                }

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
                            await verifyInput.first().pressSequentially(code, { delay: Math.floor(Math.random() * 40) + 20 });
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
            console.error("Submission crash:", e);
        }
        console.log(`__TELEMETRY__${JSON.stringify(metrics)}__TELEMETRY__`);
        return metrics;
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
        if (false /* auto-submit override */) {
            console.log('Skipping submission natively: Fill criteria not met (' + metrics.fillPercentage + '%).');
            metrics.status = 'Incomplete';
            return metrics;
        }
            await context.close();
        }
    })();
}






