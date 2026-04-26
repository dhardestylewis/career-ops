import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { buildHumanizer } from './humanize.mjs';

export async function populateAshby(page, targetUrl, resumePath, profileConfig, isBatch = false) {
    let url = targetUrl;
    if (url && url.includes('jobs.ashbyhq.com') && !url.endsWith('/application') && !url.includes('?')) {
        url = url.replace(/\/$/, '') + '/application';
    }

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log("Waiting for form elements to load...");
    await page.waitForSelector('input', { timeout: 10000 }).catch(() => {});

    console.log("Extracting Job Description context for Synthesizer...");
    try {
        const jdContainer = await page.locator('h1, .ashby-job-posting-content');
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
                    const ctx = await page.evaluateHandle(el => el.closest('.application-question, label, div.field, div') || el.parentElement, area);
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
        await page.waitForSelector('input[type="file"]', { timeout: 10000 }).catch(() => {});
        await page.waitForSelector('input[type="file"]', { timeout: 10000 }).catch(() => {});
        const genericFileInput = page.locator('input[type="file"]');
        if (await genericFileInput.count() > 0) {
            await genericFileInput.first().setInputFiles(path.resolve(resumePath));
            console.log("✅ Resume attached.");
    console.log("Waiting for Ashby to finish parsing resume and stabilize DOM...");
    try {
        console.log("Waiting up to 20 seconds for Ashby parsing engine to complete...");
        await page.waitForSelector('text="Autofill completed!"', { timeout: 20000 });
        console.log("✅ Resume parse completed by Ashby backend.");
        await page.waitForTimeout(1000); // Give React an extra second to reconcile the DOM
    } catch(e) {
        console.log("Parser wait timed out or skipped, proceeding with DOM interaction...");
    }
        } else {
            console.log("❌ No file inputs found on the page.");
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
    } catch (e) {}

    // ── Shared humanization engine (burst typing, paste-vs-type, scroll+arc) ──
    const H = buildHumanizer(page);
    const { scrollIntoView, biometricClick, interFieldTransition,
             humanType, humanPaste, safeType, safePaste, smartFill } = H;
    // Legacy aliases used in downstream heuristic code
    const safeFill = (selector, value) => smartFill(selector, value);

    // Basic Ashby native fields: short → type, URLs → paste
    await safeType('input[name="name"]', profileConfig?.candidate?.full_name || 'Daniel Hardesty Lewis');
    await safeType('input[name="_systemfield_name"]', profileConfig?.candidate?.full_name || 'Daniel Hardesty Lewis');
    
    await safeType('input[name="email"]', profileConfig?.candidate?.email || 'daniel@homecastr.com');
    await safeType('input[name="_systemfield_email"]', profileConfig?.candidate?.email || 'daniel@homecastr.com');

    // URLs and Profiles — paste
    const linkedin = profileConfig?.candidate?.linkedin || 'https://linkedin.com/in/dhardestylewis';
    const github = profileConfig?.candidate?.github || 'https://github.com/dhardestylewis';
    const website = profileConfig?.candidate?.portfolio_url || 'https://dlewis.ai';
    
    await safePaste('input[name="linkedin"]', linkedin);
    await safePaste('input[name="github"]', github);
    await safePaste('input[name="website"]', website);
    await safePaste('input[name="urls[LinkedIn]"]', linkedin);
    await safePaste('input[name="urls[GitHub]"]', github);
    await safePaste('input[id*="linkedin"], input[placeholder*="LinkedIn"], input[placeholder*="linkedin"]', linkedin);
    await safePaste('input[id*="github"], input[placeholder*="GitHub"], input[placeholder*="github"]', github);
    await safePaste('input[id*="portfolio"], input[id*="website"], input[placeholder*="Portfolio"], input[placeholder*="portfolio"]', website);
    await safeType('input[name="_systemfield_phone"], input[name="phone"]', profileConfig?.candidate?.phone || '+1 (713) 371-7875');
    await safeType('input[placeholder*="Phone"], input[placeholder*="phone"]', profileConfig?.candidate?.phone || '+1 (713) 371-7875');
    await safeType('input[type="tel"]', profileConfig?.candidate?.phone || '+1 (713) 371-7875');

    console.log("Scanning for Custom ATS questions via Heuristic Engine...");
    try {
        const minComp = profileConfig?.compensation?.target_range || profileConfig?.compensation?.minimum || '$180,000';
        const exitStory = profileConfig?.narrative?.exit_story || 'Software engineering leader.';
        const catchAll = profileConfig?.narrative?.catch_all || 'N/A - all relevant information is provided in the resume.';
        
        // Scan custom inputs directly reading labels
        const allInputs = await page.$$('input[type="text"], input[type="url"], input[type="email"], input[type="tel"], input[type="number"]');
        for (const input of allInputs) {
             try {
                 const id = await input.getAttribute('id');
                 if (!id) continue;
                 const labelEl = await page.$(`label[for="${id}"]`);
                 const labelText = labelEl ? (await labelEl.textContent() || '').toLowerCase() : '';
                 const ariaLabel = (await input.getAttribute('aria-label') || '').toLowerCase();
                 const nameAttr = (await input.getAttribute('name') || '').toLowerCase();
                 
                 const combinedLabel = labelText + " " + ariaLabel + " " + nameAttr;
                 
                 if (combinedLabel.includes('phone') || combinedLabel.includes('mobile')) {
                     if (!(await input.inputValue())) await input.fill(profileConfig?.candidate?.phone || '+1 (713) 371-7875');
                 } else if (combinedLabel.includes('salary') || combinedLabel.includes('compensation') || combinedLabel.includes('expectations') || combinedLabel.includes('package')) {
                     if (!(await input.inputValue())) await input.fill(minComp.toString());
                 } else if (combinedLabel.includes('notice period') || combinedLabel.includes('available to start') || combinedLabel.includes('earliest date') || combinedLabel.includes('join')) {
                     if (!(await input.inputValue())) await input.fill("2-4 weeks");
                 } else if (combinedLabel.includes('linkedin')) {
                     if (!(await input.inputValue())) await input.fill(linkedin);
                 } else if (combinedLabel.includes('website') || combinedLabel.includes('portfolio')) {
                     if (!(await input.inputValue())) await input.fill(website);
                 } else if (combinedLabel.includes('github')) {
                     if (!(await input.inputValue())) await input.fill(github);
                 } else {
                     // Fallback: any unfilled required input gets the catchAll answer
                     const isReq = await input.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                     if (isReq && !(await input.inputValue()) && (await input.getAttribute('type')) === 'text') await input.fill("N/A - See Resume");
                 }
             } catch(e) {}
        }
        
        const allTextAreas = await page.$$('textarea');
        for (const area of allTextAreas) {
            try {
                const id = await area.getAttribute('id');
                let labelText = '';
                if (id) {
                    const labelEl = await page.$(`label[for="${id}"]`);
                    labelText = labelEl ? (await labelEl.textContent() || '').toLowerCase() : '';
                }
                const ariaLabel = (await area.getAttribute('aria-label') || '').toLowerCase();
                const combinedLabel = ariaLabel + " " + labelText;

                if (combinedLabel.includes('why') || combinedLabel.includes('interest') || combinedLabel.includes('reason') || combinedLabel.includes('cover letter') || combinedLabel.includes('achievement') || combinedLabel.includes('project') || combinedLabel.includes('excite') || combinedLabel.includes('mission') || combinedLabel.includes('built') || combinedLabel.includes('impactful') || combinedLabel.includes('contribution') || combinedLabel.includes('hard problem') || combinedLabel.includes('success') || combinedLabel.includes('workflow') || combinedLabel.includes('feature') || combinedLabel.includes('impressive') || combinedLabel.includes('proud')) {
                    if (!(await area.inputValue())) await area.fill(exitStory);
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments') || combinedLabel.includes('tell us')) {
                    if (!(await area.inputValue())) await area.fill(catchAll);
                } else {
                    // Fallback: any unfilled required textarea gets the catchAll answer
                    const isReq = await area.evaluate(el => el.required || el.getAttribute('aria-required') === 'true');
                    if (isReq && !(await area.inputValue())) await area.fill(catchAll);
                }
            } catch(e) {}
        }
        
        // Custom Radio Buttons for dynamically injected Generic EEO structures
        try {
            const checkExactRadio = async (textLabel) => {
                try {
                    const label = page.getByText(textLabel, { exact: true });
                    if (await label.count() > 0) {
                        const input = label.locator('xpath=..//input | .//input | preceding-sibling::input | following-sibling::input');
                        if (await input.count() > 0) await input.first().check({ force: true }).catch(()=>{});
                        else await label.first().click({ force: true }).catch(()=>{});
                    }
                } catch(e) {}
            };

            const checkFuzzyRadio = async (searchStr) => {
                try {
                    const strLower = searchStr.toLowerCase();
                    const group = await page.$$(`label`);
                    for (const l of group) {
                        const txt = (await l.textContent() || "").toLowerCase();
                        if (txt.includes(strLower)) {
                            const input = await l.$('input');
                            if (input && !(await input.isChecked())) {
                                await input.check({force: true}).catch(()=>{});
                            } else {
                                await l.click({force: true}).catch(()=>{});
                            }
                        }
                    }
                } catch(e) {}
            };

            const gender = profileConfig?.eeo_demographics?.gender?.toLowerCase() || '';
            if (gender === 'male' || gender === 'm' || gender.includes('man') && !gender.includes('woman')) {
                await checkExactRadio('Male');
                await checkExactRadio('Man');
            }
            
            if (gender === 'female' || gender === 'f' || gender.includes('woman')) {
                await checkExactRadio('Female');
                await checkExactRadio('Woman');
            }
            
            const race = profileConfig?.eeo_demographics?.race?.toLowerCase() || '';
            if (race.includes('hispanic')) {
                await checkExactRadio('Hispanic or Latino');
            }
            
            const veteran = profileConfig?.eeo_demographics?.veteran?.toLowerCase() || '';
            if (veteran.includes('not a protected')) {
                await checkFuzzyRadio('not a protected veteran');
            }
            
            const disability = profileConfig?.eeo_demographics?.disability?.toLowerCase() || '';
            if (disability.includes('decline')) {
                await checkFuzzyRadio('decline to answer');
                await checkFuzzyRadio('do not wish to answer');
                await checkFuzzyRadio('decline to state');
            } else if (disability.includes('no')) {
                await checkFuzzyRadio('no, i do not have');
                await checkExactRadio('No');
            }
            
            // Generic structural answer picker for Ashby's complex grouped radio blocks
            const answerComplexRadio = async (qText, ansText) => {
                try {
                    const locs = page.locator(`:text-matches("${qText}", "i")`);
                    if (await locs.count() > 0) {
                        const parent = locs.first().locator('xpath=..');
                        const opt = parent.locator(`label:text-is("${ansText}")`);
                        if (await opt.count() > 0) await opt.first().click({force: true});
                        else {
                            const p2 = parent.locator('xpath=..');
                            const o2 = p2.locator(`label:text-is("${ansText}")`);
                            if (await o2.count() > 0) await o2.first().click({force: true});
                            else {
                                const p3 = p2.locator('xpath=..');
                                const o3 = p3.locator(`label:text-is("${ansText}")`);
                                if (await o3.count() > 0) await o3.first().click({force: true});
                            }
                        }
                    }
                } catch (e) {}
            };

            // Catch custom Visa questions 
            await answerComplexRadio('legal right to work', 'Yes');
            await answerComplexRadio('authorized to work', 'Yes');
            
            const sponsor = profileConfig?.eeo_demographics?.requires_sponsorship?.toLowerCase() || 'no';
            await answerComplexRadio('sponsor a visa', sponsor === 'no' ? 'No' : 'Yes');
            await answerComplexRadio('require sponsorship', sponsor === 'no' ? 'No' : 'Yes');
            await answerComplexRadio('require visa', sponsor === 'no' ? 'No' : 'Yes');
            
            // Hear about us
            await answerComplexRadio('hear about from', 'LinkedIn');
            await answerComplexRadio('hear about us', 'LinkedIn');
            
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

        } catch(e) {}
        
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
                    // Check if it's a proficiency matrix asking about a config skill
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
                    
                    // If not mapped, check if it's a generic Yes/No demographic (e.g. Authorized to work?)
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
    console.log("Analyzing form fill completion metrics...");
    await page.waitForTimeout(4000); // allow async blur events

    const metrics = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]):not([tabindex="-1"][aria-hidden="true"]):not([readonly]), textarea:not([name="g-recaptcha-response"]):not(.g-recaptcha-response), select'));
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
        if (metrics.fillPercentage < 100) {
            console.log('Skipping submission natively: Fill criteria not met (' + metrics.fillPercentage + '%).');
            metrics.status = 'Incomplete';
            return metrics;
        }
        // Live Submission Phase & Pagination Loop
        try {
            console.log("Locating Ashby Pagination/Submit block...");
            
            let isSubmitted = false;
            let safetyCounter = 0;
            
            while (!isSubmitted && safetyCounter < 5) {
                const submitBtn = page.locator('button:has-text("Submit Application"), button[type="submit"]');
                const nextBtn = page.locator('button:has-text("Next")');
                
                if (await submitBtn.count() > 0 && await submitBtn.first().isVisible()) {
                    console.log("Simulating native human intent vectors...");
                    await page.mouse.wheel(0, Math.floor(Math.random() * 500) + 300);
                    await page.waitForTimeout(Math.floor(Math.random() * 800) + 400);
                    await page.mouse.wheel(0, -Math.floor(Math.random() * 300) + 100);
                    
                    const box = await submitBtn.first().boundingBox();
                    if (box) {
                        await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2), { steps: Math.floor(Math.random() * 15) + 10 });
                    }
                    await page.waitForTimeout(Math.floor(Math.random() * 400) + 200);
                    
                    await submitBtn.first().click();
                    console.log("Ashby Submission Button Clicked.");
                    isSubmitted = true;
                } else if (await nextBtn.count() > 0 && await nextBtn.first().isVisible()) {
                    console.log("Ashby Pagination 'Next' Clicked.");
                    const box = await nextBtn.first().boundingBox();
                    if (box) {
                        await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2), { steps: Math.floor(Math.random() * 15) + 10 });
                    }
                    await nextBtn.first().click();
                    await page.waitForTimeout(2000); // Wait for DOM DOM updates / React router
                } else {
                    console.log("Ashby hit a dead-end on actionable buttons.");
                    break;
                }
                safetyCounter++;
            }

            if (isSubmitted) {
                // Monitor for CAPTCHA
                try {
                    console.log("Waiting for network resolution or CAPTCHA intercept...");
                    let isCaptchaActive = false;
                    
                    const captchaWatcher = page.waitForSelector('iframe[title*="reCAPTCHA"], iframe[src*="captcha"], .g-recaptcha', { state: 'visible', timeout: 30000 })
                        .then(() => {
                            isCaptchaActive = true;
                            console.log("\n⚠️ CAPTCHA DETECTED! Waiting indefinitely for you to solve it manually in the browser...\n");
                        }).catch(() => {});
                        
                    await Promise.race([
                        page.waitForURL('**/application/success*', { timeout: 900000, waitUntil: 'domcontentloaded' }), // Wait up to 15 min if CAPTCHA is active
                        page.waitForSelector('h1:has-text("Application Submitted")', { timeout: 900000 }),
                        new Promise(resolve => setTimeout(resolve, 20000)).then(() => { if (!isCaptchaActive) throw new Error("TIMEOUT"); }) 
                    ]);
                    metrics.status = "Success";
                } catch (navError) {
                    if (navError.message === "TIMEOUT") {
                        console.log("[INFO] Submission executed, waiting for network state timed out safely...");
                        metrics.status = "Success_Unverified";
                    } else {
                        const errorMsg = page.locator('.ashby-application-form-error, [role="alert"]');
                        if (await errorMsg.count() > 0 && await errorMsg.isVisible()) {
                            metrics.status = "Submission_Error";
                        } else {
                            metrics.status = "Success"; // Implicit assuming XHR passed
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
        await page.pause();
    }

    return metrics;
}

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { chromium } = await import('playwright');
    import('path').then(path => {
        import('fs').then(fs => {
            import('js-yaml').then(yaml => {
                (async () => {
                    const isBatch = process.env.BATCH_EVAL_MODE === 'true';
                    const targetUrl = process.argv[2];
                    const targetResumeUrl = process.argv[3];
                    
                    let profileConfig = {};
                    try {
                        const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
                        profileConfig = yaml.load(fileContents);
                    } catch (e) {}

                    const launchArgs = ['--window-position=-10000,-10000'];
                    const context = await chromium.launchPersistentContext(profileConfig.execution?.chrome_profilePath || 'data/chrome-bot-profile', { 
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
                        await populateAshby(page, targetUrl, targetResumeUrl, profileConfig, isBatch);
                    } catch (e) {
                        console.error(e);
                    }
                    
                    if (isBatch) {
                        await context.close();
                    }
                })();
            });
        });
    });
}



