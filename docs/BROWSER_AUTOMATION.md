# Browser Automation Lanes

This repo prefers the least invasive browser lane that can finish the task.

## Order of preference

1. API / CLI / mail-first
2. Local headless browser
3. Local headed browser with a dedicated automation profile
4. Attached headed browser for sites that need an already logged-in human session
5. Remote browser session in the cloud

## 1. API / CLI / mail-first

Use this whenever possible:

- Gmail scripts for inbox search, outreach, and sent-mail verification
- Direct ATS APIs for scan flows
- `browser-extract.mjs` for compact extraction when full browser MCP snapshots are too heavy

This avoids visible browser automation entirely.

## 2. Local headless browser

The default project-level `.mcp.json` registers Playwright MCP in headless mode:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless"]
    }
  }
}
```

Use this for:

- JD extraction
- liveness checks
- many read-only application workflows
- forms that do not require a logged-in personal browser session

This is the best default when the site works in headless mode.

## 3. Local headed browser without fighting the user's main browser

If headless gets blocked but we still want to stay off the user's main browser, use a separate automation profile and a dedicated headed browser window.

Recommended properties:

- a separate `userDataDir`
- a dedicated automation Chrome or Edge profile
- launch only when needed
- close it when done

This still runs on the same machine, so Windows may bring the browser window to the foreground sometimes, but it does not need to share tabs, cookies, or extensions with the user's personal browser.

See:

- `templates/mcp.playwright.headed-isolated.example.json`
- `config/profile.yml` -> `execution.chrome_profilePath`
- existing auto-fill runners under `src/scrapers/`

## 4. Attached headed browser for human-session sites

Some sites require the user's real login state, hardware-backed auth, passkeys, or extensions. In those cases, attach Playwright MCP to an existing Chrome or Edge session through the browser extension.

Use this only when needed because it shares:

- existing tabs
- cookies
- installed extensions
- live signed-in state

See `templates/mcp.playwright.extension.example.json`.

For the library-driven scripts in this repo, use the `extension_attach` lane.
That lane attaches over CDP to an existing browser session instead of launching
a new browser process. It is the code-runner counterpart to the MCP extension
lane and is meant for:

- existing logged-in browser state
- sites that need passkeys or human-authenticated sessions
- cases where the agent should reuse a browser you already prepared

Configure it with:

- `execution.browser_lane: extension_attach`
- `execution.browser_attach_cdp_url: http://127.0.0.1:9222`

or:

- `CAREER_OPS_BROWSER_LANE=extension_attach`
- `CAREER_OPS_BROWSER_ATTACH_CDP_URL=http://127.0.0.1:9222`

To make that usable for future agents on this machine, use the bundled launcher:

```bash
npm run browser:attach:start
npm run browser:attach:status
npm run browser:attach:stop
```

The launcher starts a dedicated browser window off-screen with a CDP endpoint so
agents can attach without taking over the main desktop.

## 5. Remote browser session in the cloud

If we want the browser fully off-device, use a remote browser provider.

The cleanest future-agent pattern is:

- keep local Codex as the MCP host
- point browser automation at a remote browser session or HTTP MCP endpoint
- use local files only for prompts, CV material, and tracker updates

Good fit:

- long-running automation
- jobs that should not open local windows
- human-in-the-loop review from a hosted session viewer

See `templates/mcp.playwright.remote-http.example.json`.

For library-driven scripts in this repo, set `execution.browser_lane: remote_cdp`
plus `execution.browser_remote_cdp_url` in `config/profile.yml`, or export
`CAREER_OPS_BROWSER_LANE=remote_cdp` and `CAREER_OPS_BROWSER_CDP_URL=...`.
That lets `browser-extract.mjs` and the ATS auto-fill helpers run against an
off-device browser session instead of a local window.

## Practical recommendation matrix

### Best default

Use local headless Playwright MCP.

### Best headed local option

Use a dedicated automation profile, not the user's personal Chrome profile.

### Best zero-desktop-interference option

Use a remote browser session in the cloud.

### Best option when a real human login is required

Use extension attach as a deliberate fallback.

## What "headed but not snatching the mouse" really means

There are two separate issues:

1. Window visibility and focus
2. Input control

Playwright-style automation can drive DOM, keyboard, and pointer actions without needing your physical mouse in hand. But a headed browser on the same Windows desktop may still grab focus or appear on top. The safest ways around that are:

- stay headless
- run the browser remotely
- use a separate machine, VM, or remote desktop host for headed sessions

OS-level virtual desktops can reduce annoyance, but they are not a portable, agent-neutral guarantee, so this repo treats them as optional operator tricks rather than the primary automation lane.

## Environment overrides

These helpers can be switched without editing code:

- `CAREER_OPS_BROWSER_LANE=local_headless|local_headed|remote_cdp|extension_attach`
- `CAREER_OPS_BROWSER_CDP_URL=...`
- `CAREER_OPS_BROWSER_ATTACH_CDP_URL=...`
- `CAREER_OPS_BROWSER_CHANNEL=chrome|msedge|chromium`
- `CAREER_OPS_BROWSER_STORAGE_STATE=/abs/path/auth-state.json`
- `CAREER_OPS_BROWSER_OFFSCREEN=true|false`
- `CHROME_PROFILE_PATH=/abs/path/to/profile`

## Quick switching

Use the helper script to switch future-agent defaults without hand-editing files:

```bash
npm run browser:lane -- mcp-headless --write-mcp
npm run browser:lane -- mcp-extension --write-mcp
npm run browser:lane -- local-headed --write-profile
npm run browser:lane -- remote-cdp --cdp-url http://127.0.0.1:9222 --write-profile
npm run browser:lane -- extension-attach --cdp-url http://127.0.0.1:9222 --write-profile
```
