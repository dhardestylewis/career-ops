import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

let url = process.argv[2];
if (url && url.includes('jobs.ashbyhq.com') && !url.endsWith('/application') && !url.includes('?')) {
    url = url.replace(/\/$/, '') + '/application';
}
const resumePath = process.argv[3];

if (!url || !resumePath) {
    console.error("Usage: node auto-fill-ashby.mjs <url> <resume-pdf-path>");
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
        const genericFileInput = page.locator('input[type="file"]');
        if (await genericFileInput.count() > 0) {
            await genericFileInput.first().setInputFiles(path.resolve(resumePath));
            console.log("✅ Resume attached.");
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

    // Basic Ashby native fields
    await safeFill('input[name="name"]', profileConfig?.candidate?.full_name || 'Daniel Hardesty Lewis');
    await safeFill('input[name="_systemfield_name"]', profileConfig?.candidate?.full_name || 'Daniel Hardesty Lewis');
    
    await safeFill('input[name="email"]', profileConfig?.candidate?.email || 'daniel@homecastr.com');
    await safeFill('input[name="_systemfield_email"]', profileConfig?.candidate?.email || 'daniel@homecastr.com');

    // URLs and Profiles
    const linkedin = profileConfig?.candidate?.linkedin || 'https://linkedin.com/in/dhardestylewis';
    const github = profileConfig?.candidate?.github || 'https://github.com/dhardestylewis';
    const website = profileConfig?.candidate?.portfolio_url || 'https://dlewis.ai';
    
    await safeFill('input[name="linkedin"]', linkedin);
    await safeFill('input[name="github"]', github);
    await safeFill('input[name="website"]', website);
    await safeFill('input[name="urls[LinkedIn]"]', linkedin);
    await safeFill('input[name="urls[GitHub]"]', github);

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
                 } else if (combinedLabel.includes('notice period') || combinedLabel.includes('available to start')) {
                     if (!(await input.inputValue())) await input.fill("2-4 weeks");
                 } else if (combinedLabel.includes('linkedin')) {
                     if (!(await input.inputValue())) await input.fill(linkedin);
                 } else if (combinedLabel.includes('website') || combinedLabel.includes('portfolio')) {
                     if (!(await input.inputValue())) await input.fill(website);
                 } else if (combinedLabel.includes('github')) {
                     if (!(await input.inputValue())) await input.fill(github);
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

                if (combinedLabel.includes('why') || combinedLabel.includes('interest') || combinedLabel.includes('reason') || combinedLabel.includes('cover letter') || combinedLabel.includes('achievement') || combinedLabel.includes('project')) {
                    if (!(await area.inputValue())) await area.fill(exitStory);
                } else if (combinedLabel.includes('anything else') || combinedLabel.includes('additional info') || combinedLabel.includes('comments')) {
                    if (!(await area.inputValue())) await area.fill(catchAll);
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
            
            // Catch custom Visa questions 
            await checkFuzzyRadio('authorized to work');
            const sponsor = profileConfig?.eeo_demographics?.requires_sponsorship?.toLowerCase() || 'no';
            if (sponsor === 'no') {
                const sponsorLabels = await page.$$('label');
                for (const label of sponsorLabels) {
                    const text = (await label.textContent() || '').toLowerCase();
                    if (text.includes('sponsorship') || text.includes('require visa')) {
                        const noInput = await label.$('xpath=..//input[@type="radio" and translate(@value,"NO","no")="no" or following-sibling::text()[contains(translate(.,"NO","no"), "no")]]');
                        if (noInput) await noInput.check({force: true}).catch(()=>{});
                        else {
                            // Ashby often places radio inside or next to label
                            const genericNo = await page.$$(`label:has-text("No")`);
                            for(let n of genericNo) { 
                                const i = await n.$('input');
                                if (i) await i.check({force:true}).catch(()=>{});
                            }
                        }
                    }
                }
            }
            
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

    await browser.close();
})();
