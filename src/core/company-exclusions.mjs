import fs from 'fs';
import path from 'path';

const DEFAULT_EXCLUDED_COMPANIES_PATH = path.resolve('data/state/excluded_companies.json');
const DEFAULT_EXCLUDED_JOB_TARGETS_PATH = path.resolve('data/state/excluded_job_targets.json');
const BLOCKLIST_OVERRIDE_ENV = 'CAREER_OPS_ALLOW_EXCLUDED_COMPANIES';

export function normalizeBlockToken(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function addToken(targetSet, value) {
  const token = normalizeBlockToken(value);
  if (token) targetSet.add(token);
}

function tokenizeUrl(value) {
  const tokens = new Set();

  try {
    const url = new URL(String(value));
    addToken(tokens, url.href);
    addToken(tokens, `${url.hostname}${url.pathname}`);
    addToken(tokens, url.pathname);

    for (const segment of url.pathname.split('/')) {
      addToken(tokens, segment);
    }

    addToken(tokens, url.search);
    for (const [key, val] of url.searchParams.entries()) {
      addToken(tokens, key);
      addToken(tokens, val);
    }
  } catch {
    // Non-URL values are handled by the caller.
  }

  return tokens;
}

function tokenizeExcludedEntry(entry) {
  const raw = String(entry ?? '').trim();
  const tokens = new Set();

  if (!raw) return tokens;

  addToken(tokens, raw);
  if (/^https?:\/\//i.test(raw)) {
    for (const token of tokenizeUrl(raw)) {
      tokens.add(token);
    }
  }

  return tokens;
}

function tokenizeCandidate({ companyName = '', roleTitle = '', targetUrls = [] } = {}) {
  const tokens = new Set();

  addToken(tokens, companyName);
  addToken(tokens, roleTitle);
  for (const targetUrl of targetUrls) {
    addToken(tokens, targetUrl);

    if (!targetUrl) continue;

    try {
      const url = new URL(String(targetUrl));
      addToken(tokens, `${url.hostname}${url.pathname}`);
      addToken(tokens, url.pathname);

      for (const segment of url.pathname.split('/')) {
        addToken(tokens, segment);
      }

      addToken(tokens, url.search);
      for (const [key, val] of url.searchParams.entries()) {
        addToken(tokens, key);
        addToken(tokens, val);
      }
    } catch {
      // Non-URL values are already tokenized via addToken(targetUrl).
    }
  }

  return tokens;
}

function normalizeJobTargetRecord(entry) {
  if (typeof entry === 'string') {
    const raw = entry.trim();
    if (!raw) return null;
    return {
      company: raw,
      role: '',
      url: '',
      reason: '',
      source: '',
    };
  }

  if (!entry || typeof entry !== 'object') return null;

  const company = String(entry.company ?? entry.name ?? '').trim();
  const role = String(entry.role ?? entry.title ?? '').trim();
  const url = String(entry.url ?? entry.targetUrl ?? entry.href ?? '').trim();
  const reason = String(entry.reason ?? '').trim();
  const source = String(entry.source ?? '').trim();

  if (!company && !role && !url) return null;

  return { company, role, url, reason, source };
}

export function loadExcludedCompanyEntries(filePath = DEFAULT_EXCLUDED_COMPANIES_PATH) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed)
      ? parsed.map((entry) => String(entry ?? '').trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function loadExcludedJobTargets(filePath = DEFAULT_EXCLUDED_JOB_TARGETS_PATH) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeJobTargetRecord).filter(Boolean);
  } catch {
    return [];
  }
}

function textMatches(candidate, blocked) {
  const candidateToken = normalizeBlockToken(candidate);
  const blockedToken = normalizeBlockToken(blocked);
  if (!candidateToken || !blockedToken) return false;
  return candidateToken === blockedToken
    || candidateToken.includes(blockedToken)
    || blockedToken.includes(candidateToken);
}

function urlMatches(candidateTokens, blockedUrl) {
  const blockedToken = normalizeBlockToken(blockedUrl);
  if (!blockedToken) return false;
  return candidateTokens.has(blockedToken);
}

function entryMatchesCandidateTokens(entry, candidateTokens) {
  const blockedToken = normalizeBlockToken(entry);
  if (!blockedToken) return false;

  for (const candidateToken of candidateTokens) {
    if (!candidateToken) continue;
    if (
      candidateToken === blockedToken
      || candidateToken.includes(blockedToken)
      || blockedToken.includes(candidateToken)
    ) {
      return true;
    }
  }

  return false;
}

function matchJobTarget({ companyName = '', roleTitle = '', candidateTokens, jobTarget }) {
  if (!jobTarget) return null;

  const companyMatch = jobTarget.company ? textMatches(companyName, jobTarget.company) : true;
  if (!companyMatch) return null;

  const roleMatch = jobTarget.role ? textMatches(roleTitle, jobTarget.role) : false;
  const targetUrlMatch = jobTarget.url ? urlMatches(candidateTokens, jobTarget.url) : false;

  if (jobTarget.role && jobTarget.url) {
    if (!roleMatch && !targetUrlMatch) return null;
  } else if (jobTarget.role && !roleMatch) {
    return null;
  } else if (jobTarget.url && !targetUrlMatch) {
    return null;
  }

  return {
    kind: 'target',
    entry: jobTarget,
    matchedOn: {
      company: jobTarget.company ? companyMatch : false,
      role: jobTarget.role ? roleMatch : false,
      url: jobTarget.url ? targetUrlMatch : false,
    },
  };
}

export function getExcludedTargetMatch({
  companyName = '',
  roleTitle = '',
  targetUrl = '',
  targetUrls = null,
  companyEntries = null,
  jobTargets = null,
  allowOverride = false,
} = {}) {
  if (allowOverride || process.env[BLOCKLIST_OVERRIDE_ENV] === '1') {
    return null;
  }

  const excludedEntries = companyEntries ?? loadExcludedCompanyEntries();
  const candidateTokens = tokenizeCandidate({
    companyName,
    roleTitle,
    targetUrls: Array.isArray(targetUrls) && targetUrls.length > 0 ? targetUrls : [targetUrl],
  });

  for (const entry of excludedEntries) {
    const companyMatch = textMatches(companyName, entry);
    const urlMatch = entryMatchesCandidateTokens(entry, candidateTokens);
    if (companyMatch || urlMatch) {
      return {
        kind: 'company',
        entry,
        matchedOn: {
          company: companyMatch,
          url: urlMatch,
        },
      };
    }
  }

  const excludedJobTargets = jobTargets ?? loadExcludedJobTargets();
  for (const jobTarget of excludedJobTargets) {
    const match = matchJobTarget({ companyName, roleTitle, candidateTokens, jobTarget });
    if (match) {
      return match;
    }
  }

  return null;
}

export function getExcludedCompanyMatch(details = {}) {
  return getExcludedTargetMatch(details);
}

export function isExcludedCompanyTarget(details = {}) {
  return getExcludedTargetMatch(details) !== null;
}

export function isExcludedTarget(details = {}) {
  return getExcludedTargetMatch(details) !== null;
}

export function createExcludedCompanyMetrics({ companyName = '', targetUrl = '', match = null } = {}) {
  const blockedEntry = match?.kind === 'target'
    ? `${match.entry.company}${match.entry.role ? ` — ${match.entry.role}` : ''}${match.entry.url ? ` (${match.entry.url})` : ''}`
    : (match?.entry || '');
  const blockedLabel = match?.kind === 'target'
    ? 'Matched excluded job target'
    : 'Matched excluded company entry';

  return {
    status: match?.kind === 'target' ? 'Blocked_Excluded_Target' : 'Blocked_Excluded_Company',
    fillPercentage: 0,
    total: 0,
    filled: 0,
    blocked: true,
    blockedReason: blockedEntry ? `${blockedLabel}: ${blockedEntry}` : blockedLabel,
    blockedMatch: match?.kind === 'target'
      ? (match.entry.url || match.entry.role || match.entry.company || '')
      : (match?.entry || ''),
    company: companyName,
    url: targetUrl,
  };
}
