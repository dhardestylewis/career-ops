import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const MIRROR_ROOT = 'C:/Users/dhl/data/Portfolio/career-ops';

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function normalizePath(value) {
  return value ? path.resolve(value) : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function candidateRoots() {
  return unique([
    normalizePath(process.env.GMAIL_AUTH_ROOT),
    normalizePath(process.env.CAREER_OPS_HOME),
    process.cwd(),
    MIRROR_ROOT,
  ]);
}

function resolveExplicitFiles() {
  const explicitCredentials = normalizePath(process.env.GMAIL_CREDENTIALS_PATH);
  const explicitToken = normalizePath(process.env.GMAIL_TOKEN_PATH);

  if (!explicitCredentials && !explicitToken) {
    return null;
  }

  const credentialsPath = explicitCredentials || (explicitToken ? path.join(path.dirname(explicitToken), 'credentials.json') : null);
  const tokenPath = explicitToken || (explicitCredentials ? path.join(path.dirname(explicitCredentials), 'token.json') : null);

  return {
    source: 'env',
    credentialsPath,
    tokenPath,
  };
}

export function resolveGmailAuthLocation({ requireToken = true } = {}) {
  const explicit = resolveExplicitFiles();
  if (explicit) {
    if (!explicit.credentialsPath || !fileExists(explicit.credentialsPath)) {
      throw new Error(`Gmail credentials file not found at ${explicit.credentialsPath || '(unset)'}.`);
    }
    if (requireToken && (!explicit.tokenPath || !fileExists(explicit.tokenPath))) {
      throw new Error(`Gmail token file not found at ${explicit.tokenPath || '(unset)'}.`);
    }
    return explicit;
  }

  const currentRoot = path.resolve(process.cwd()).toLowerCase();
  const mirrorRoot = path.resolve(MIRROR_ROOT).toLowerCase();

  for (const root of candidateRoots()) {
    const credentialsPath = path.join(root, 'credentials.json');
    const tokenPath = path.join(root, 'token.json');

    if (!fileExists(credentialsPath)) {
      continue;
    }

    if (requireToken && !fileExists(tokenPath)) {
      continue;
    }

    return {
      source: root.toLowerCase() === currentRoot
        ? 'cwd'
        : root.toLowerCase() === mirrorRoot
          ? 'mirror-root'
          : 'external-root',
      credentialsPath,
      tokenPath,
    };
  }

  return null;
}

function readOAuthConfig(credentialsPath) {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const oauth = credentials.installed || credentials.web || credentials;
  const clientId = oauth.client_id || oauth.clientId;
  const clientSecret = oauth.client_secret || oauth.clientSecret;
  const redirectUris = oauth.redirect_uris || oauth.redirectUris || [];
  const redirectUri = redirectUris[0] || oauth.redirect_uri || oauth.redirectUri || 'http://localhost';

  if (!clientId || !clientSecret) {
    throw new Error(`Gmail credentials at ${credentialsPath} do not contain client_id/client_secret.`);
  }

  return { clientId, clientSecret, redirectUri };
}

export function loadGmailClient(options = {}) {
  const location = resolveGmailAuthLocation({ requireToken: true, ...options });
  if (!location) {
    throw new Error(
      'Could not find Gmail OAuth files. Add credentials.json/token.json to the repo root, set GMAIL_CREDENTIALS_PATH and GMAIL_TOKEN_PATH, or set GMAIL_AUTH_ROOT.'
    );
  }

  const { clientId, clientSecret, redirectUri } = readOAuthConfig(location.credentialsPath);
  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  auth.setCredentials(JSON.parse(fs.readFileSync(location.tokenPath, 'utf8')));

  return {
    auth,
    source: location.source,
    credentialsPath: location.credentialsPath,
    tokenPath: location.tokenPath,
  };
}

export function loadGmailService(options = {}) {
  const client = loadGmailClient(options);
  return {
    gmail: google.gmail({ version: 'v1', auth: client.auth }),
    ...client,
  };
}
