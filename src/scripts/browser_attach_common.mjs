import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import yaml from 'js-yaml';

const DEFAULT_PORT = 9222;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_METADATA_PATH = path.resolve('data/tmp/browser-attach-runtime.json');

function loadProfileConfig(profilePath = 'config/profile.yml') {
  try {
    return yaml.load(fs.readFileSync(path.resolve(profilePath), 'utf8')) || {};
  } catch {
    return {};
  }
}

export function resolveAttachRuntime() {
  const profile = loadProfileConfig();
  const execution = profile.execution || {};
  const metadataPath = process.env.CAREER_OPS_BROWSER_ATTACH_METADATA || DEFAULT_METADATA_PATH;
  const port = Number(
    process.env.CAREER_OPS_BROWSER_ATTACH_PORT ||
      execution.browser_attach_port ||
      DEFAULT_PORT,
  );
  const host =
    process.env.CAREER_OPS_BROWSER_ATTACH_HOST ||
    execution.browser_attach_host ||
    DEFAULT_HOST;
  const chromePath =
    process.env.CAREER_OPS_BROWSER_ATTACH_EXECUTABLE ||
    execution.browser_attach_executable ||
    execution.browserAttachExecutable ||
    firstExisting([
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ]);
  const userDataDir = path.resolve(
    process.env.CAREER_OPS_BROWSER_ATTACH_USER_DATA_DIR ||
      execution.browser_attach_profile_path ||
      execution.browserAttachProfilePath ||
      'data/chrome-attach-profile',
  );
  const url = `http://${host}:${port}`;
  return { profile, execution, metadataPath, port, host, chromePath, userDataDir, url };
}

function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function checkDebugger(url) {
  try {
    const json = await fetchJson(`${url}/json/version`);
    return { ok: true, json };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

export function readMetadata(metadataPath) {
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeMetadata(metadataPath, metadata) {
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

export async function startAttachableBrowser(runtime = resolveAttachRuntime()) {
  if (!runtime.chromePath) {
    throw new Error(
      'No Chrome/Edge executable found. Set CAREER_OPS_BROWSER_ATTACH_EXECUTABLE or execution.browser_attach_executable.',
    );
  }

  const already = await checkDebugger(runtime.url);
  if (already.ok) {
    return {
      status: 'already-running',
      url: runtime.url,
      webSocketDebuggerUrl: already.json.webSocketDebuggerUrl,
      browser: already.json.Browser,
      metadataPath: runtime.metadataPath,
    };
  }

  const first = await launchAndWait(runtime, runtime.userDataDir);
  if (first.ok) return first.result;

  const fallbackDir = path.resolve('data/tmp', `chrome-attach-profile-fallback-${Date.now()}`);
  const second = await launchAndWait(runtime, fallbackDir);
  if (second.ok) return second.result;

  throw new Error(`Attach browser launch timed out for ${runtime.url}`);
}

async function launchAndWait(runtime, userDataDir) {
  const args = [
    `--remote-debugging-port=${runtime.port}`,
    `--remote-debugging-address=${runtime.host}`,
    `--user-data-dir=${userDataDir}`,
    '--new-window',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-position=-10000,-10000',
    '--window-size=1280,900',
    '--disable-blink-features=AutomationControlled',
    'about:blank',
  ];

  const child = spawn(runtime.chromePath, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  writeMetadata(runtime.metadataPath, {
    pid: child.pid,
    startedAt: new Date().toISOString(),
    executable: runtime.chromePath,
    userDataDir,
    url: runtime.url,
  });

  let connected = null;
  let stableChecks = 0;
  for (let i = 0; i < 60; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    connected = await checkDebugger(runtime.url);
    if (connected.ok) {
      stableChecks += 1;
      if (stableChecks >= 3) {
        return {
          ok: true,
          result: {
            status: userDataDir === runtime.userDataDir ? 'started' : 'started-fallback-profile',
            url: runtime.url,
            webSocketDebuggerUrl: connected.json.webSocketDebuggerUrl,
            browser: connected.json.Browser,
            metadataPath: runtime.metadataPath,
            userDataDir,
          },
        };
      }
      continue;
    }
    stableChecks = 0;
  }
  try {
    stopAttachableBrowserByPid(child.pid);
  } catch {}
  return { ok: false };
}

export function stopAttachableBrowserByPid(pid) {
  if (process.platform === 'win32') {
    const result = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    if (result.status !== 0 && result.status !== 128 && result.status !== 255) {
      throw new Error(`taskkill failed for PID ${pid}`);
    }
    return;
  }
  process.kill(pid);
}
