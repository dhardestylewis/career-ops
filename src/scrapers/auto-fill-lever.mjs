import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';


// Dynamically extract Profile configuration
let profileConfig = {};
try {
    const fileContents = fs.readFileSync(path.resolve('config/profile.yml'), 'utf8');
    profileConfig = yaml.load(fileContents);
    
    // ==========================================
    // SMARTER DEBUGGING: PII RANDOMIZATION
    // ==========================================
    if (process.env.DEBUG_MODE === 'true' && profileConfig.candidate) {
        // Randomize email alias to prevent ATS spam rate-limits
        const emailParts = profileConfig.candidate.email.split('@');
        if (emailParts.length === 2) {
            profileConfig.candidate.email = `${emailParts[0]}+debug${Math.floor(Math.random()*90000)+10000}@${emailParts[1]}`;
        }
        // Randomize last two digits of phone number
        if (profileConfig.candidate.phone) {
            const p = profileConfig.candidate.phone;
            profileConfig.candidate.phone = p.substring(0, p.length - 2) + Math.floor(Math.random()*90 + 10).toString();
        }
        console.log(`[DEBUG MODE ACTIVE] ATS Velocity Bypass Engaged:\n Email: ${profileConfig.candidate.email}\n Phone: ${profileConfig.candidate.phone}`);
    }
} catch (e) {
    console.log("⚠️ Could not load profile.yml");
}

export async function populateLever(page, targetUrl, resumePath, profileConfig, isBatch = false) {
    const url = targetUrl;

    // Lever's application form is at /apply - the base URL is just the job listing
    const applyUrl = url.endsWith('/apply') ? url : url.replace(/\/$/, '') + '/apply';
    console.log(`Navigating to ${applyUrl}...`);
    await page.goto(applyUrl, { waitUntil: 'domcontentloaded' });

    console.log("Waiting for form elements to load...");
    // Wait for the full application form to mount (Lever uses SPA routing, inputs render asynchronously)
    await page.waitForSelector('.application-form, form[action*="apply"], input[name="name"]', { timeout: 15000 }).catch(() => {});
    // Secondary wait to ensure dynamic fields (URL inputs, location) have mounted
    await page.waitForSelector('input[name="urls[LinkedIn]"]', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500); // Final settle buffer

    console.log("Extracting Job Description context for Synthesizer...");
    try {
        const jdContainer = await page.locator('.postings-wrapper');
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
                const jdText = await jdContainer.first().innerText();
                fs.writeFileSync(path.resolve('data/job_description.txt'), jdText);
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
        // Lever usually has an explicit file input for resumes
        const fileInput = page.locator('input[type="file"][name="resume"]');
        if (await fileInput.count() > 0) {
            await fileInput.first().setInputFiles(path.resolve(resumePath));
            console.log("✅ Resume attached.");
        console.log("⏳ Waiting for Lever's asynchronous resume parser to finish (Syncing React State)...");
        try {
            // Wait for Lever's 'Success!' or 'Autofill completed!' span
            await page.waitForSelector('text="Success!"', { timeout: 8000 }).catch(()=>{});
        } catch(e){}
        await page.waitForTimeout(3000); // Hard buffer to allow React state reconciliation to flush to DOM inputs
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

    console.log("Simulating JD reading behavior (ML Evasion)...");
    const simulateReading = async () => {
        for(let i=0; i<3; i++) {
            await page.mouse.wheel(0, Math.floor(Math.random() * 600) + 300);
            await page.waitForTimeout(Math.floor(Math.random() * 2500) + 1500);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(Math.floor(Math.random() * 1000) + 1000);
    };
    await simulateReading();
    console.log("Filling standard details...");
    
        let lastMousePosition = { x: 0, y: 0 };
    const biometricClick = async (page, locator) => {
        try {
            if (await locator.count() === 0) return;
            // Native force focus
            await locator.first().evaluate(el => el.focus()).catch(()=>{});
            
            const box = await locator.first().boundingBox();
            if (!box) { await locator.first().click({ force: true }); return; }
            
            const targetX = box.x + (box.width / 2);
            const targetY = box.y + (box.height / 2);
            
            await page.mouse.move(targetX, targetY, { steps: Math.floor(Math.random() * 15) + 10 });
            await page.waitForTimeout(Math.floor(Math.random() * 300) + 100); // Micro-hesitation
            await locator.first().click({ force: true, delay: Math.floor(Math.random() * 80) + 30 });
        } catch (e) {
            await locator.first().click({ force: true });
        }
    };

    const safeFill = async (selector, value) => {
        try {
            const el = page.locator(selector);
            if (await el.count() > 0) {
                // Check if the resume parser already populated this field
                const currentVal = await el.first().evaluate(el => el.value);
                if (currentVal && currentVal.trim().length > 0) {
                    // console.log(`[Lever] Field ${selector} already populated by parser. Skipping.`);
                    return; // Skip typing to avoid double-filling and save time
                }

                // Force focus natively to bypass Playwright's strict visibility checks
                await el.first().evaluate(el => {
                    el.focus();
                    el.value = ''; 
                });
                
                await page.keyboard.press('Control+A'); // Additional failsafe
                await page.keyboard.press('Backspace');
                
                await page.waitForTimeout(Math.floor(Math.random() * 100) + 50);
                
                for (const char of value) {
                    await page.keyboard.press(char);
                    let delay = Math.floor(Math.random() * 30) + 15;
                    if (char === '@' || char === '.') delay += Math.floor(Math.random() * 200) + 100;
                    if (char === ' ') delay += Math.floor(Math.random() * 100) + 50;
                    await page.waitForTimeout(delay);
                }
                await page.waitForTimeout(Math.floor(Math.random() * 500) + 200);
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
    
    // Autocomplete Location fields (Lever Location Autocomplete API)
    // We type the candidate's city, wait for the dropdown to populate,
    // then click the first result so the hidden `selectedLocation` JSON field is committed.
    try {
        const locField = page.locator('#location-input, input[name="location"], input[placeholder*="location" i], input[placeholder*="city" i]');
        if (await locField.count() > 0 && await locField.first().isVisible()) {
            await locField.first().focus();
            await locField.first().fill("");

            // Use the candidate's city from profile, fallback to New York
            const candidateCity = profileConfig?.location?.city || profileConfig?.candidate?.city || 'New York';
            await locField.first().pressSequentially(candidateCity, { delay: 80 });

            // Wait for the dropdown results list to appear
            const dropdownResult = page.locator('.dropdown-location, #location-0, [class*="dropdown-location"]');
            await page.waitForTimeout(1800);  // allow geocoder API debounce

            if (await dropdownResult.count() > 0) {
                // Click the very first result — #location-0 is always the best match
                await dropdownResult.first().click({ force: true });
                await page.waitForTimeout(500);
                // Verify hidden selectedLocation was committed
                const hiddenVal = await page.locator('#selected-location').first().getAttribute('value').catch(() => '');
                if (!hiddenVal || hiddenVal === '') {
                    // Fallback: ArrowDown + Enter if click failed to commit
                    await locField.first().focus();
                    await page.keyboard.press('ArrowDown');
                    await page.waitForTimeout(200);
                    await page.keyboard.press('Enter');
                }
            } else {
                // No visible dropdown — use keyboard fallback
                await page.keyboard.press('ArrowDown');
                await page.waitForTimeout(200);
                await page.keyboard.press('Enter');
            }
            await page.waitForTimeout(400);
        }
    } catch(e) {}
    
    const allSelects = await page.$$('select');
    for (const select of allSelects) {
        try {
            const id = await select.getAttribute('id') || '';
            const name = await select.getAttribute('name') || '';
            
            // Check contextual label
            let labelText = '';
            if (id) {
                const labelEl = await page.$(`label[for="${id}"]`);
                if (labelEl) labelText = await labelEl.textContent() || '';
            }
            if (!labelText) {
                const parent = await page.evaluateHandle(el => el.closest('.application-question, label') || el.parentElement, select);
                if (parent) labelText = await parent.textContent() || '';
            }
            const lowerLabel = labelText.toLowerCase();

            const options = await select.$$eval('option', opts => opts.map(o => ({label: o.textContent, value: o.value})));
            
            // Geographic selects — country and location dropdowns
            const matchGeo = options.find(o => o.label && (o.label.toLowerCase().includes('united states') || o.label.toLowerCase().includes('new york')));
            if (matchGeo && (lowerLabel.includes('country') || lowerLabel.includes('location') || lowerLabel.includes('where are you'))) {
                await select.selectOption({ label: matchGeo.label }).catch(()=>{});
            }
            // Also try US for any country/region dropdown
            const usMatch = options.find(o => o.label && o.label.toLowerCase() === 'united states');
            if (usMatch && (lowerLabel.includes('country') || lowerLabel.includes('region'))) {
                await select.selectOption({ label: usMatch.label }).catch(()=>{});
            }
            
            // Veteran Status
            if (lowerLabel.includes('veteran')) {
                const matchVet = options.find(o => o.label && o.label.toLowerCase().includes('not a protected veteran'));
                if (matchVet) await select.selectOption({ label: matchVet.label }).catch(()=>{});
            }

            // Disability Status
            if (lowerLabel.includes('disability')) {
                const matchDis = options.find(o => o.label && (o.label.toLowerCase().includes('no') || o.label.toLowerCase().includes('decline') || o.label.toLowerCase().includes('not')));
                if (matchDis) await select.selectOption({ label: matchDis.label }).catch(()=>{});
            }

            // University Dropdown (Palantir)
            if (lowerLabel.includes('university') || lowerLabel.includes('school')) {
                const matchSchool = options.find(o => o.label && (o.label.toLowerCase().includes('baruch') || o.label.toLowerCase().includes('city university of new york') || o.label.toLowerCase() === 'cuny'));
                if (matchSchool) await select.selectOption({ label: matchSchool.label }).catch(()=>{});
                else {
                    const matchOth = options.find(o => o.label && o.label.toLowerCase().includes('other'));
                    if (matchOth) await select.selectOption({ label: matchOth.label }).catch(()=>{});
                }
            }

            // "How did you hear about us / Source" selects
            if (lowerLabel.includes('hear') || lowerLabel.includes('source') || lowerLabel.includes('find out')) {
                const matchSrc = options.find(o => o.label && (
                    o.label.toLowerCase().includes('linkedin') || 
                    o.label.toLowerCase().includes('company website') || 
                    o.label.toLowerCase().includes('direct') ||
                    o.label.toLowerCase().includes('job board')
                ));
                if (matchSrc) await select.selectOption({ label: matchSrc.label }).catch(()=>{});
            }

            // Wealthfront Custom: Client
            if (lowerLabel.includes('wealthfront client')) {
                const matchWf = options.find(o => o.label && o.label.toLowerCase().includes('no, i have not'));
                if (matchWf) await select.selectOption({ label: matchWf.label }).catch(()=>{});
            }

            // ShieldAI Custom: Relocation
            if (lowerLabel.includes('willing to relocate')) {
                const matchRel = options.find(o => o.label && o.label.toLowerCase() === 'yes');
                if (matchRel) await select.selectOption({ label: matchRel.label }).catch(()=>{});
            }

            // Zoox Custom: Sponsorship custom dropdown
            if (lowerLabel.includes('sponsorship: do you require sponsorship')) {
                const matchSpon = options.find(o => o.label && o.label.toLowerCase() === 'no');
                if (matchSpon) await select.selectOption({ label: matchSpon.label }).catch(()=>{});
            }

            // Houzz Custom: Age 18
            if (lowerLabel.includes('18 years of age') || lowerLabel.includes('18 years or older')) {
                const matchAge = options.find(o => o.label && o.label.toLowerCase().includes('yes'));
                if (matchAge) await select.selectOption({ label: matchAge.label }).catch(()=>{});
            }

            // Houzz Custom: Eligible to work
            if (lowerLabel.includes('legally eligible to work')) {
                const matchElig = options.find(o => o.label && o.label.toLowerCase().includes('yes'));
                if (matchElig) await select.selectOption({ label: matchElig.label }).catch(()=>{});
            }

            // Houzz Custom: Previously employed
            if (lowerLabel.includes('employed by houzz') || lowerLabel.includes('previously employed')) {
                const matchEmp = options.find(o => o.label && o.label.toLowerCase().includes('no'));
                if (matchEmp) await select.selectOption({ label: matchEmp.label }).catch(()=>{});
            }

            // Houzz Custom: Hybrid / Relocation
            if (lowerLabel.includes('able to work in one of our offices') || lowerLabel.includes('hybrid')) {
                const matchReloc = options.find(o => o.label && (o.label.toLowerCase().includes('relocate') || o.label.toLowerCase() === 'yes'));
                if (matchReloc) await select.selectOption({ label: matchReloc.label }).catch(()=>{});
            }
        } catch(e) {}
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
        const questionBlocks = await page.$$('.application-question');
        for (const block of questionBlocks) {
            const text = (await block.textContent()).toLowerCase();
            
            const clickRadioLabel = async (labelText) => {
                const labels = await block.$$('label');
                for (const l of labels) {
                    const lt = await l.textContent();
                    if (lt && lt.trim() === labelText) {
                        const inp = await l.$('input');
                        if (inp) await inp.check({force: true}).catch(()=>{});
                        else await l.click().catch(()=>{});
                        return true;
                    }
                }
                return false;
            };

            // Work Authorization (Yes)
            if (text.includes('authorized to work') && !text.includes('sponsorship')) {
                await clickRadioLabel('Yes');
            }
            // Sponsorship (No)
            if (text.includes('sponsorship') || text.includes('require sponsorship') || text.includes('visa')) {
                if (profileConfig?.eeo_demographics?.requires_sponsorship === "No" || !profileConfig?.eeo_demographics) {
                    await clickRadioLabel('No');
                }
            }
            // US Clearance
            if (text.includes('currently hold') && text.includes('security clearance')) {
                await clickRadioLabel('No'); // Or profile config driven
            }
            if (text.includes('eligible to obtain') && text.includes('security clearance')) {
                await clickRadioLabel('Yes');
            }
            // Languages (Palantir)
            if (text.includes('language skill')) {
                const labels = await block.$$('label');
                for (const l of labels) {
                    const lt = await l.textContent();
                    if (lt && lt.toLowerCase().includes('english')) {
                        const inp = await l.$('input');
                        if (inp) await inp.check({force: true}).catch(()=>{});
                        else await l.click({force: true}).catch(()=>{}); // Click label directly if sibling
                    }
                }
            }

            // Houzz Custom: Hybrid / Relocation (Radio Fallback)
            if (text.includes('able to work in one of our offices') || text.includes('hybrid work commitment')) {
                const success = await clickRadioLabel('Yes, but I would first need to relocate');
                if (!success) await clickRadioLabel('Yes');
            }

            // Houzz Custom: 18 years of age (Radio Fallback)
            if (text.includes('18 years of age') || text.includes('18 years or older')) {
                await clickRadioLabel('Yes');
            }

            // Houzz Custom: Legally eligible (Radio Fallback)
            if (text.includes('legally eligible to work') || (text.includes('eligible to work') && text.includes('country where this job is located'))) {
                await clickRadioLabel('Yes');
            }

            // Houzz Custom: Previously employed (Radio Fallback)
            if (text.includes('employed by houzz') || text.includes('previously employed')) {
                await clickRadioLabel('No');
            }

            // AngelList Custom: Visa / Work Auth — handle all four variants
            if (text.includes('united states citizen or permanent resident')) {
                // Primary answer: US citizen
                const clicked = await clickRadioLabel('United States Citizen or Permanent Resident');
                if (!clicked) await clickRadioLabel('Yes'); // fallback
            }
            // AngelList: Location commitment (can/cannot work there)
            if (text.includes('able to work') && (text.includes('this role') || text.includes('this location'))) {
                const clicked = await clickRadioLabel('Yes');
                if (!clicked) await clickRadioLabel('Yes, but I would first need to relocate');
            }

            // Neon Custom: Portuguese Deep Tech
            if (text.includes('lidero diretamente times')) {
                await clickRadioLabel("Atuo como líder técnico individual (Staff/Principal Engineer), sem responsabilidade direta por gestão de pessoas.");
            }
            if (text.includes('escalar arquiteturas de microsserviços')) {
                await clickRadioLabel("Sim: Tenho experiência prática em escalar arquiteturas de microsserviços e sistemas orientados a eventos em escala massiva.");
            }
            if (text.includes('sistemas críticos onde consistência')) {
                await clickRadioLabel("Sim: Já atuei diretamente com sistemas críticos onde consistência e regulação eram pilares fundamentais.");
            }
            if (text.includes('integra métricas de saúde técnica')) {
                await clickRadioLabel("Estabeleço uma governança que integra métricas de saúde técnica (como disponibilidade e performance) ao roadmap de produto, garantindo que a escala não comprometa a estabilidade.");
            }
            
        }
    } catch(e) {}

    console.log("Scanning for Custom ATS questions via Heuristic Engine...");
    try {
        const minComp = profileConfig?.compensation?.target_range || profileConfig?.compensation?.minimum || '$180,000';
        const exitStory = profileConfig?.narrative?.exit_story || 'Software engineering leader.';
        const catchAll = profileConfig?.narrative?.catch_all || 'N/A - all relevant information is provided in the resume.';
        
        const questionBlocks = await page.$$('.application-question, label');
        for (const block of questionBlocks) {
            const lowerText = (await block.textContent()).toLowerCase();

            // Ignore standard fields
            if (lowerText.includes('resume') || lowerText.includes('cv') || lowerText.includes('email') || lowerText.includes('phone') || lowerText.includes('company')) {
                continue;
            }
            if (lowerText.includes('name') && !lowerText.includes('preferred') && !lowerText.includes('pronounce')) {
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

            // Heuristic 3: Cover Letter analogues / Why us / Interest / Achievements / Projects / etc.
            // Exclude structural questions that happen to use words like 'interest' (like clearance, relocation)
            if (
                (lowerText.includes('why') || lowerText.includes('interest') || lowerText.includes('reason') || lowerText.includes('cover letter') || lowerText.includes('achievement') || lowerText.includes('project') || lowerText.includes('excite') || lowerText.includes('mission') || lowerText.includes('built')) && 
                !lowerText.includes('clearance') && !lowerText.includes('relocat') && !lowerText.includes('travel') && !lowerText.includes('timeline') && !lowerText.includes('video') && !lowerText.includes('url')
            ) {
                const area = await block.$('textarea');
                if (area && !(await area.inputValue())) await area.fill(exitStory);
            } else if (lowerText.includes('anything else') || lowerText.includes('additional info') || lowerText.includes('comments')) {
                const area = await block.$('textarea');
                if (area && !(await area.inputValue())) await area.fill(catchAll);
            }

            // ShieldAI Custom: Legal Name
            if (lowerText.includes('full legal name') || lowerText.includes('disabilitysignature') || lowerText.includes('signature')) {
                const t = await block.$('input[type="text"]');
                if (t && !(await t.inputValue())) await t.fill(profileConfig?.candidate?.name || profileConfig?.candidate?.full_name || "Daniel Hardesty Lewis");
            }

            // ShieldAI Custom: Job applying for
            if (lowerText.includes('full time job(s) are you applying for')) {
                const area = await block.$('textarea');
                if (area && !(await area.inputValue())) await area.fill("Software Engineer");
            }

            // ShieldAI Custom: Date
            if (lowerText.includes('date') && lowerText.length < 50) {
                const t = await block.$('input[type="text"]');
                const d = new Date();
                const ds = `${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
                if (t && !(await t.inputValue())) await t.fill(ds);
            }

            // Wealthfront Custom: Field of Study
            if (lowerText.includes('major field of study')) {
                const t = await block.$('input[type="text"]');
                if (t && !(await t.inputValue())) await t.fill(profileConfig?.education?.degree || "Computer Science");
            }

            // Zoox Custom: Export Control
            if (lowerText.includes('determining export licensing requirements') || lowerText.includes('export control')) {
                const area = await block.$('textarea');
                if (area && !(await area.inputValue())) await area.fill("United States Citizen, since birth.");
            }

            // Articulate Custom: Top 3 Technologies
            if (lowerText.includes('3 technologies') || lowerText.includes('top technologies') || lowerText.includes('most proficient in')) {
                const area = await block.$('textarea');
                const techList = (profileConfig?.narrative?.skills || ['Python', 'PyTorch', 'Kubernetes']).slice(0, 3).join(', ');
                if (area && !(await area.inputValue())) await area.fill(techList);
            }

            // Generic fallback: any required textarea still empty → fill with catch-all
            const allRequiredAreas = await block.$$('textarea[required], textarea.required-field');
            for (const reqArea of allRequiredAreas) {
                if (!(await reqArea.inputValue())) {
                    const areaCtx = (await reqArea.evaluate(el => el.closest('.application-question')?.textContent || '')).toLowerCase();
                    // Don't override questions that already have dedicated handlers above
                    if (!areaCtx.includes('export control') && !areaCtx.includes('technologies') && !areaCtx.includes('why') && !areaCtx.includes('cover letter') && !areaCtx.includes('achievement')) {
                        await reqArea.fill(catchAll).catch(() => {});
                    }
                }
            }

            // Zoox Custom: Checkbox variant for "How did you hear about us"
            if (lowerText.includes('linkedin') && lowerText.includes('zoox ads') && block.$$('input[type="checkbox"]')) {
                const labels = await block.$$('label');
                for (const l of labels) {
                    const lt = await l.textContent();
                    if (lt && lt.toLowerCase().includes('linkedin')) {
                        const cb = await l.$('input[type="checkbox"]');
                        if (cb) await cb.check({ force: true }).catch(()=>{});
                    }
                }
            }

            // Heuristic 4: Clearance 
            if (lowerText.includes('clearance')) {
                const t = await block.$('input[type="text"]');
                if (t && !(await t.inputValue())) await t.fill("None");
            }
            
            // Heuristic 5: Preferred Name & Pronunciation
            if (lowerText.includes('preferred name') || lowerText.includes('pronounce')) {
                const t = await block.$('input[type="text"]');
                if (t && !(await t.inputValue())) await t.fill(profileConfig?.candidate?.full_name?.split(' ')[0] || "Daniel");
            }

            // Heuristic 6: Custom Array Dropdowns (How did you hear about us)
            if (lowerText.includes('hear about') || lowerText.includes('source')) {
                const sel = await block.$('select');
                if (sel) {
                    const opts = await sel.$$eval('option', os => os.map(o => o.textContent));
                    let match = opts.find(o => o && o.toLowerCase().includes('linkedin'));
                    if (!match) match = opts.find(o => o && o.toLowerCase().includes('job board'));
                    if (match) await sel.selectOption({ label: match }).catch(()=>{});
                }
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
    try {
        const cleanUrl = url.replace(/[^a-zA-Z0-9]/g, '_');
        const dumpPath = path.resolve(`data/logs/dom_dump_lever_${cleanUrl}.html`);
        const html = await page.content();
        fs.writeFileSync(dumpPath, html);
    } catch(e) {}
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
                   const cleanName = el.name.split('[')[0]; // Handle nested names like name[] or name[]_id
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

                const container = el.closest('div.field, .application-question, label') || el.closest('div') || el;
                missingDOM.push(container.outerHTML.substring(0, 1500));
            }
        }
        
        return { total, filled, fillPercentage: total > 0 ? Math.round((filled / total) * 100) : 0, missingDOM };
    });

    // Take a full-page snapshot for asynchronous review
    if (!fs.existsSync('data/archive')) fs.mkdirSync('data/archive', { recursive: true });
    const screenshotPath = `data/archive/debug_${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(()=>{});
    console.log(`📸 Captured full-page DOM state to ${screenshotPath}`);

    if (isBatch) {
        if (metrics.fillPercentage < 100) {
            console.log('Skipping submission natively: Fill criteria not met (' + metrics.fillPercentage + '%).');
            metrics.status = 'Incomplete';
            metrics.snapshot = screenshotPath;
            return metrics;
        }
        // Live Submission Phase
        try {
            console.log("Simulating native human intent vectors...");
            // Simulate reading layout scroll
            await page.mouse.wheel(0, Math.floor(Math.random() * 500) + 300);
            await page.waitForTimeout(Math.floor(Math.random() * 800) + 400);
            await page.mouse.wheel(0, -Math.floor(Math.random() * 300) + 100);
            
            console.log("Locating Lever POST submit button...");
            const submitBtn = page.locator('button.postings-btn:has-text("Submit"), button[data-qa="btn-submit"]');
            if (await submitBtn.count() > 0) {
                const box = await submitBtn.first().boundingBox();
                if (box) {
                    // Physics Arc Simulation to button center
                    await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2), { steps: Math.floor(Math.random() * 15) + 10 });
                    console.log("Simulating pre-submit hesitation...");
                    await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1500); // Extreme humanization
                }
                await submitBtn.first().click({ force: true, delay: Math.floor(Math.random() * 80) + 40 });
                console.log("Lever Submission Button Clicked.");
                
                // Monitor for proper CAPTCHA intercept or true URL resolution
                try {
                    console.log("Waiting for network resolution or CAPTCHA intercept...");
                    let isCaptchaActive = false;
                    
                    const captchaWatcher = page.waitForSelector(
                        'iframe[title*="reCAPTCHA"], iframe[title*="hCaptcha"], iframe[title*="captcha"], iframe[src*="hcaptcha"], iframe[src*="captcha"], .g-recaptcha, #h-captcha, [data-hcaptcha-widget-id]',
                        { state: 'visible', timeout: 30000 }
                    ).then(() => {
                        isCaptchaActive = true;
                        console.log("\n⚠️ CAPTCHA DETECTED! Waiting indefinitely for you to solve it manually in the browser...\n");
                    }).catch(() => {});
                        
                    await Promise.race([
                        page.waitForURL('**/thanks*', { timeout: 900000, waitUntil: 'domcontentloaded' }), // Wait up to 15 min if CAPTCHA is active
                        page.waitForSelector('h2:has-text("Application Submitted"), h1:has-text("Thank you")', { timeout: 900000 }),
                        new Promise(resolve => setTimeout(resolve, 20000)).then(() => { if (!isCaptchaActive) throw new Error("TIMEOUT"); }) 
                    ]);
                    metrics.status = "Success";
                } catch (navError) {
                    if (navError.message === "TIMEOUT") {
                        console.log("[INFO] Submission executed, waiting for network state timed out safely...");
                        const errorMsg = page.locator('.error-message');
                        if (await errorMsg.count() > 0 && await errorMsg.isVisible()) {
                            metrics.status = "Submission_Error";
                        } else {
                            metrics.status = "Success_Unverified";
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
        await page.pause();
    }
    return metrics;
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
            await populateLever(page, targetUrl, targetResumeUrl, profileConfig, isBatch);
        } catch (e) {
            console.error(e);
        }
        
        // Let the unified handler deal with cleanup, but for CLI we kill here:
        if (isBatch) {
            await context.close();
        }
    })();
}






