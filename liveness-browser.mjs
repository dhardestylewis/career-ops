/**
 * liveness-browser.mjs - Playwright-driven liveness helpers shared by
 * browser-extract and related verification flows.
 */

import { classifyLiveness } from './src/core/liveness-core.mjs';

const NAVIGATE_TIMEOUT_MS = 15_000;
const HYDRATION_WAIT_MS = 2_000;

export const LIVENESS_CONTEXT_OPTIONS = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'en-US',
};

export async function newLivenessPage(browser) {
  const context = await browser.newContext(LIVENESS_CONTEXT_OPTIONS);
  return context.newPage();
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function jitteredDelayMs(baseMs) {
  if (!baseMs || baseMs <= 0) return 0;
  return baseMs + Math.floor(Math.random() * baseMs);
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/,
  /^localhost\.localdomain$/,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^::$/,
  /^fc[0-9a-f]{2}:/,
  /^fe80:/,
];

function normalizeHost(rawHostname) {
  if (!rawHostname) return '';
  let h = String(rawHostname).toLowerCase();
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1);
  if (h.endsWith('.')) h = h.slice(0, -1);
  return h;
}

function extractMappedIPv4(host) {
  const dotted = host.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) return dotted[1];
  const hex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const a = parseInt(hex[1], 16);
    const b = parseInt(hex[2], 16);
    return `${(a >> 8) & 0xff}.${a & 0xff}.${(b >> 8) & 0xff}.${b & 0xff}`;
  }
  return null;
}

export function rejectPrivateOrInvalid(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { code: 'invalid_url', reason: 'invalid URL' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { code: 'unsupported_protocol', reason: `unsupported protocol ${parsed.protocol}` };
  }
  const host = normalizeHost(parsed.hostname);
  const mappedIPv4 = extractMappedIPv4(host);
  const candidates = mappedIPv4 ? [host, mappedIPv4] : [host];
  for (const candidate of candidates) {
    if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(candidate))) {
      return { code: 'blocked_host', reason: `blocked host ${parsed.hostname}` };
    }
  }
  return null;
}

export async function checkUrlLiveness(page, url, { extraSettleMs = 0 } = {}) {
  const guardError = rejectPrivateOrInvalid(url);
  if (guardError) {
    return { result: 'uncertain', code: guardError.code, reason: guardError.reason };
  }
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATE_TIMEOUT_MS });
    const status = response?.status() ?? 0;
    await page.waitForTimeout(HYDRATION_WAIT_MS + extraSettleMs);
    const finalUrl = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    const applyControls = await page.evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"]')
      );

      return candidates
        .filter((element) => {
          if (element.closest('nav, header, footer')) return false;
          if (element.closest('[aria-hidden="true"]')) return false;

          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          if (!element.getClientRects().length) return false;

          return Array.from(element.getClientRects()).some((rect) => rect.width > 0 && rect.height > 0);
        })
        .map((element) => {
          const label = [
            element.innerText,
            element.value,
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          return label;
        })
        .filter(Boolean);
    });

    return classifyLiveness({ status, finalUrl, bodyText, applyControls });
  } catch (err) {
    return {
      result: 'uncertain',
      code: 'navigation_error',
      reason: `navigation error: ${err.message.split('\n')[0]}`,
    };
  }
}

const CHALLENGE_CODES = new Set(['bot_challenge', 'access_blocked']);

export function isChallengeResult(result) {
  return result?.result === 'uncertain' && CHALLENGE_CODES.has(result.code);
}

export function createHeadedPageProvider(chromium) {
  let browser = null;
  let page = null;
  let launchFailed = false;
  return {
    async get() {
      if (page) return page;
      if (launchFailed) return null;
      try {
        browser = await chromium.launch({ headless: false });
        const context = await browser.newContext(LIVENESS_CONTEXT_OPTIONS);
        page = await context.newPage();
        return page;
      } catch {
        launchFailed = true;
        browser = null;
        page = null;
        return null;
      }
    },
    async close() {
      if (browser) {
        try {
          await browser.close();
        } catch {
          // best-effort teardown
        }
      }
      browser = null;
      page = null;
    },
  };
}

export async function checkUrlLivenessWithFallback(page, url, { getHeadedPage } = {}) {
  const first = await checkUrlLiveness(page, url);
  if (!getHeadedPage || !isChallengeResult(first)) {
    return first;
  }
  const headedPage = await getHeadedPage();
  if (!headedPage) {
    return first;
  }
  const second = await checkUrlLiveness(headedPage, url, { extraSettleMs: 3_000 });
  if (isChallengeResult(second)) {
    return { ...second, reason: `${second.reason} (headed retry also blocked)` };
  }
  return second;
}
