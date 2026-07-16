# Career-Ops Working Memory

This file stores behavioral steering and operational state for future agents in this worktree. It does not expand the user-facing source-of-truth boundary.

## Current Operating Defaults

- Prefer the least invasive execution lane that can finish the job:
  1. Gmail / API / CLI
  2. local headless browser
  3. local headed off-screen browser
  4. extension / attach browser
  5. remote CDP browser
- For browser work, read `docs/BROWSER_AUTOMATION.md` first if the task involves apply, scan, extraction, or LinkedIn/browser automation.
- The local code-runner default in `config/profile.yml` is currently `execution.browser_lane: extension_attach` with a local CDP endpoint at `http://127.0.0.1:9222`.
- The attach-browser lifecycle commands are:
  - `npm run browser:attach:start`
  - `npm run browser:attach:status`
  - `npm run browser:attach:stop`
- `extension_attach` should auto-start the local attach browser if the CDP endpoint is down.

## Mail / Outreach Lane

- Use the Gmail CLI lane before opening a browser:
  - `npm run mail:latest`
  - `npm run mail:search -- "<query>"`
  - `npm run mail:auth`
- Resolve duplicate or existing outreach before sending by running:
  - `npm run outreach:audit -- "Recipient Name"`
- Exit code `4` means an established/protected relationship. Show the exact copy in the current chat and wait for explicit approval; do not infer consent from a batch goal, private channel, prior thread, or old approval.
- Treat unknown relationship status as protected. The gate covers people, organizations, alternate contacts, and fallback inboxes across job-search and Homecastr lanes.
- Keep LinkedIn DM work separate from Gmail/API work unless a real API or attach-browser path is required.

## Application / Submission Truthfulness

- Do not claim an ATS/application-form submission happened unless there is concrete evidence such as:
  - a confirmed tracker update,
  - an employer/ATS confirmation,
  - or direct observed submission in the current run.
- Distinguish clearly between:
  - outreach sent,
  - draft prepared,
  - form filled,
  - and application submitted.

## Repo Hygiene

- Preserve user modifications. Be selective and additive.
- Prefer capturing reusable workflow knowledge in repo-readable files instead of leaving it only in chat history.
- If a future agent needs current browser defaults or attach behavior, check:
  - `config/profile.yml`
  - `.mcp.json`
  - `docs/BROWSER_AUTOMATION.md`
  - this `MEMORY.md`
