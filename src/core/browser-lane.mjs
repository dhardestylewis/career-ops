import fs from 'fs';
import path from 'path';
import { resolveAttachRuntime, checkDebugger, startAttachableBrowser } from '../scripts/browser_attach_common.mjs';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function toBool(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function normalizeLane(value, fallback) {
  const normalized = String(value || fallback || 'local_headless')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (normalized === 'remote' || normalized === 'remote_http' || normalized === 'remote_browser') {
    return 'remote_cdp';
  }
  if (normalized === 'extension' || normalized === 'attach' || normalized === 'existing_browser') {
    return 'extension_attach';
  }
  if (['local_headless', 'local_headed', 'remote_cdp', 'extension_attach'].includes(normalized)) {
    return normalized;
  }
  return fallback || 'local_headless';
}

export function resolveBrowserLaneConfig(profileConfig = {}, options = {}) {
  const execution = profileConfig?.execution || {};
  const env = process.env;
  const defaultLane = options.defaultLane || 'local_headless';
  const lane = normalizeLane(
    pick(
      env.CAREER_OPS_BROWSER_LANE,
      execution.browser_lane,
      execution.browserLane,
      defaultLane,
    ),
    defaultLane,
  );
  const channel = pick(
    env.CAREER_OPS_BROWSER_CHANNEL,
    execution.browser_channel,
    execution.browserChannel,
  );
  const userDataDirRaw = pick(
    env.CHROME_PROFILE_PATH,
    env.CAREER_OPS_BROWSER_USER_DATA_DIR,
    execution.chrome_profilePath,
    execution.browser_user_data_dir,
    execution.browserUserDataDir,
    'data/chrome-bot-profile',
  );
  const remoteCdpUrl = pick(
    env.CAREER_OPS_BROWSER_CDP_URL,
    env.CAREER_OPS_BROWSER_ATTACH_CDP_URL,
    execution.browser_remote_cdp_url,
    execution.browserRemoteCdpUrl,
    execution.browser_attach_cdp_url,
    execution.browserAttachCdpUrl,
  );
  const storageState = pick(
    env.CAREER_OPS_BROWSER_STORAGE_STATE,
    execution.browser_storage_state,
    execution.browserStorageState,
  );
  const headedOffscreen = toBool(
    pick(
      env.CAREER_OPS_BROWSER_OFFSCREEN,
      execution.browser_headed_offscreen,
      execution.browserHeadedOffscreen,
    ),
    true,
  );
  const saveSession = toBool(
    pick(
      env.CAREER_OPS_BROWSER_SAVE_SESSION,
      execution.browser_save_session,
      execution.browserSaveSession,
    ),
    true,
  );

  return {
    lane,
    channel,
    userDataDir: path.resolve(String(userDataDirRaw)),
    remoteCdpUrl,
    storageState: storageState ? path.resolve(String(storageState)) : undefined,
    headedOffscreen,
    saveSession,
  };
}

export function describeBrowserLane(config) {
  if (config.lane === 'remote_cdp') {
    return `remote_cdp (${config.remoteCdpUrl || 'missing endpoint'})`;
  }
  if (config.lane === 'extension_attach') {
    return `extension_attach (${config.remoteCdpUrl || 'missing attach endpoint'})`;
  }
  if (config.lane === 'local_headed') {
    return `local_headed (${config.userDataDir})`;
  }
  return `local_headless (${config.channel || 'bundled chromium'})`;
}

export async function launchAutomationContext({
  chromium,
  profileConfig = {},
  defaultLane = 'local_headless',
  purpose = 'browser task',
  contextOptions = {},
  launchArgs = [],
  launchOptions = {},
}) {
  const laneConfig = resolveBrowserLaneConfig(profileConfig, { defaultLane });
  const ua = pick(launchOptions.userAgent, DEFAULT_USER_AGENT);
  const args = [...launchArgs];
  if (laneConfig.lane === 'local_headed' && laneConfig.headedOffscreen) {
    args.unshift('--window-position=-10000,-10000');
  }

  if (laneConfig.lane === 'remote_cdp' || laneConfig.lane === 'extension_attach') {
    let connectTarget = laneConfig.remoteCdpUrl;
    if (laneConfig.lane === 'extension_attach' && laneConfig.remoteCdpUrl) {
      try {
        const attachRuntime = resolveAttachRuntime();
        const status = await checkDebugger(laneConfig.remoteCdpUrl);
        if (!status.ok) {
          const started = await startAttachableBrowser(attachRuntime);
          connectTarget = started.webSocketDebuggerUrl || laneConfig.remoteCdpUrl;
        } else {
          connectTarget = status.json.webSocketDebuggerUrl || laneConfig.remoteCdpUrl;
        }
      } catch (error) {
        throw new Error(`Failed to auto-start attach browser for ${purpose}: ${String(error?.message || error)}`);
      }
    }
    if (!laneConfig.remoteCdpUrl) {
      throw new Error(
        `${laneConfig.lane} selected for ${purpose}, but no CAREER_OPS_BROWSER_CDP_URL / CAREER_OPS_BROWSER_ATTACH_CDP_URL or execution.browser_remote_cdp_url / execution.browser_attach_cdp_url is configured.`,
      );
    }
    let browser;
    let lastConnectError;
    for (let i = 0; i < 6; i += 1) {
      try {
        browser = await chromium.connectOverCDP(connectTarget);
        break;
      } catch (error) {
        lastConnectError = error;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    if (!browser) throw lastConnectError;
    const existing = browser.contexts()[0];
    const context = existing || await browser.newContext({
      ...contextOptions,
      ...(laneConfig.storageState && fs.existsSync(laneConfig.storageState)
        ? { storageState: laneConfig.storageState }
        : {}),
      userAgent: contextOptions.userAgent || ua,
    });
    return {
      laneConfig,
      browser,
      context,
      close: async () => {
        if (laneConfig.lane === 'extension_attach') return;
        await browser.close().catch(() => {});
      },
    };
  }

  if (laneConfig.lane === 'local_headed') {
    let context;
    try {
      context = await chromium.launchPersistentContext(laneConfig.userDataDir, {
        headless: false,
        ...(laneConfig.channel ? { channel: laneConfig.channel } : {}),
        args,
        ignoreDefaultArgs: ['--enable-automation'],
        userAgent: ua,
        ...launchOptions,
      });
    } catch (error) {
      const message = String(error?.message || error || '');
      if (!/ProcessSingleton|profile directory is already in use|Lock file can not be created/i.test(message)) {
        throw error;
      }
      const fallbackProfilePath = path.resolve('data/tmp', `chrome-bot-profile-fallback-${Date.now()}`);
      fs.mkdirSync(fallbackProfilePath, { recursive: true });
      console.log(`Profile locked at ${laneConfig.userDataDir}; retrying with temporary profile ${fallbackProfilePath}`);
      context = await chromium.launchPersistentContext(fallbackProfilePath, {
        headless: false,
        ...(laneConfig.channel ? { channel: laneConfig.channel } : {}),
        args,
        ignoreDefaultArgs: ['--enable-automation'],
        userAgent: ua,
        ...launchOptions,
      });
    }
    return {
      laneConfig,
      context,
      close: async () => {
        await context.close().catch(() => {});
      },
    };
  }

  const browser = await chromium.launch({
    headless: true,
    ...(laneConfig.channel ? { channel: laneConfig.channel } : {}),
    args,
    ...launchOptions,
  });
  const context = await browser.newContext({
    ...contextOptions,
    ...(laneConfig.storageState && fs.existsSync(laneConfig.storageState)
      ? { storageState: laneConfig.storageState }
      : {}),
    userAgent: contextOptions.userAgent || ua,
  });
  return {
    laneConfig,
    browser,
    context,
    close: async () => {
      await browser.close().catch(() => {});
    },
  };
}

export async function installAutomationStealth(context, options = {}) {
  if (options.visibilitySpoof) {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
      Object.defineProperty(document, 'hidden', { get: () => false });
      Object.defineProperty(document, 'hasFocus', { value: () => true });
    });
    return;
  }

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.navigator.chrome = { runtime: {} };
  });
}
