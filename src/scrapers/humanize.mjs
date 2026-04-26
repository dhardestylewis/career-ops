/**
 * humanize.mjs — Shared biometric interaction engine
 * Imported by auto-fill-lever.mjs, auto-fill-ashby.mjs, auto-fill-greenhouse.mjs
 *
 * Principles:
 *   • Every element is scrolled into view before interaction
 *   • Typed fields (names, short answers) use variable WPM with burst pauses
 *   • Pasted fields (URLs, long pre-written text) use native input events — instant
 *   • Inter-field navigation alternates Tab and mouse arc randomly
 *   • All delays are non-uniform to defeat timing fingerprinting
 */

/**
 * Build a humanization context bound to a Playwright page.
 * Returns all interaction primitives as a single object.
 *
 * Usage:
 *   import { buildHumanizer } from '../scrapers/humanize.mjs';
 *   const H = buildHumanizer(page);
 *   await H.safeType('input[name="name"]', 'Daniel Hardesty Lewis');
 *   await H.safePaste('input[name="urls[LinkedIn]"]', 'https://linkedin.com/in/...');
 *   await H.biometricClick(page.locator('button.submit'));
 */
export function buildHumanizer(page) {

    // ── Scroll ────────────────────────────────────────────────────────────────
    const scrollIntoView = async (locator) => {
        try {
            await locator.first().evaluate(el => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            await page.waitForTimeout(Math.floor(Math.random() * 280) + 120);
        } catch(_) {}
    };

    // ── Mouse arc ─────────────────────────────────────────────────────────────
    let _mx = Math.floor(Math.random() * 400) + 200;
    let _my = Math.floor(Math.random() * 300) + 100;
    const arcMouseTo = async (targetX, targetY) => {
        const steps = Math.floor(Math.random() * 18) + 8;
        await page.mouse.move(targetX, targetY, { steps });
        _mx = targetX; _my = targetY;
    };

    const _boxCenter = async (locator) => {
        try {
            const b = await locator.first().boundingBox();
            return b ? [b.x + b.width * (0.3 + Math.random() * 0.4),
                        b.y + b.height * (0.3 + Math.random() * 0.4)]
                     : [_mx, _my];
        } catch(_) { return [_mx, _my]; }
    };

    // ── Biometric click: scroll → arc → hesitate → click ─────────────────────
    const biometricClick = async (locator) => {
        try {
            if (await locator.count() === 0) return;
            await scrollIntoView(locator);
            const [tx, ty] = await _boxCenter(locator);
            await arcMouseTo(tx, ty);
            await page.waitForTimeout(Math.floor(Math.random() * 220) + 60);
            await locator.first().click({ force: true, delay: Math.floor(Math.random() * 70) + 20 });
        } catch(_) {
            try { await locator.first().click({ force: true }); } catch(__) {}
        }
    };

    // ── Inter-field transition: Tab (~55%) or mouse arc (~45%) ────────────────
    const interFieldTransition = async (nextLocator) => {
        if (Math.random() < 0.55) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(Math.floor(Math.random() * 180) + 70);
        } else if (nextLocator) {
            try {
                const [tx, ty] = await _boxCenter(nextLocator);
                await arcMouseTo(tx, ty);
                await page.waitForTimeout(Math.floor(Math.random() * 140) + 50);
            } catch(_) {}
        }
    };

    // ── Burst typing: variable 50-120 WPM, burst clusters, occasional pauses ──
    const humanType = async (value) => {
        let i = 0;
        while (i < value.length) {
            const burstLen = Math.floor(Math.random() * 6) + 3;
            const burst = value.slice(i, i + burstLen);
            for (const char of burst) {
                await page.keyboard.type(char);
                let delay = Math.floor(Math.random() * 80) + 40; // 40–120 ms base
                if (char === '@')                delay += Math.floor(Math.random() * 180) + 120;
                else if (char === '.')           delay += Math.floor(Math.random() * 120) + 60;
                else if (char === ' ')           delay += Math.floor(Math.random() * 60)  + 20;
                else if ('-()/'.includes(char)) delay += Math.floor(Math.random() * 40)  + 20;
                await page.waitForTimeout(delay);
            }
            i += burstLen;
            // Inter-burst pause distribution
            const r = Math.random();
            if      (r < 0.08) await page.waitForTimeout(Math.floor(Math.random() * 800) + 400); // rare long pause
            else if (r < 0.25) await page.waitForTimeout(Math.floor(Math.random() * 200) + 80);  // medium
            else               await page.waitForTimeout(Math.floor(Math.random() * 60)  + 20);  // short
        }
    };

    // ── Clipboard paste: instant fill via native React-compatible input events ─
    // Use for: URLs, long pre-written text blocks, any content humans would paste
    const humanPaste = async (locator, value) => {
        try {
            await locator.first().evaluate((el, v) => {
                el.focus();
                el.value = '';
                // React synthetic value setter
                const setter = Object.getOwnPropertyDescriptor(
                    el instanceof HTMLTextAreaElement
                        ? window.HTMLTextAreaElement.prototype
                        : window.HTMLInputElement.prototype,
                    'value'
                )?.set;
                if (setter) setter.call(el, v);
                el.dispatchEvent(new Event('input',  { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }, value);
            await page.waitForTimeout(Math.floor(Math.random() * 180) + 80);
        } catch(_) {
            await locator.first().fill(value).catch(() => {});
        }
    };

    // ── safeType: scroll → arc mouse → click → clear → type ─────────────────
    // Use for: name, email, phone, company, short custom answers (<90 chars)
    const safeType = async (selector, value) => {
        try {
            const el = page.locator(selector);
            if (await el.count() === 0) return;
            const current = await el.first().evaluate(e => e.value).catch(() => '');
            if (current && current.trim().length > 0) return; // resume parser already filled
            await scrollIntoView(el);
            const [tx, ty] = await _boxCenter(el);
            await arcMouseTo(tx, ty);
            await page.waitForTimeout(Math.floor(Math.random() * 130) + 40);
            await el.first().click({ force: true });
            await page.waitForTimeout(Math.floor(Math.random() * 70) + 25);
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(Math.floor(Math.random() * 70) + 25);
            await humanType(value);
            await page.waitForTimeout(Math.floor(Math.random() * 280) + 120);
        } catch(_) {}
    };

    // ── safePaste: scroll → paste instantly ───────────────────────────────────
    // Use for: URLs, long pre-written text (>90 chars), any pasted content
    const safePaste = async (selector, value) => {
        try {
            const el = page.locator(selector);
            if (await el.count() === 0) return;
            const current = await el.first().evaluate(e => e.value).catch(() => '');
            if (current && current.trim().length > 0) return;
            await scrollIntoView(el);
            await humanPaste(el, value);
        } catch(_) {}
    };

    // ── smartFill: auto-routes to safeType or safePaste by content length ─────
    // <90 chars → type; ≥90 chars or URLs → paste
    const smartFill = async (selector, value) => {
        const isUrl = /^https?:\/\//.test(value);
        const isLong = value.length >= 90;
        return (isUrl || isLong) ? safePaste(selector, value) : safeType(selector, value);
    };

    return {
        scrollIntoView,
        arcMouseTo,
        biometricClick,
        interFieldTransition,
        humanType,
        humanPaste,
        safeType,
        safePaste,
        smartFill,
    };
}
