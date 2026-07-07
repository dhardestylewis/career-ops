# Codex Guide

Career-ops supports Codex through the same shared router used by the other CLI integrations.

## How Codex maps to career-ops

- `AGENTS.md` is the shared instruction source.
- Root `CODEX.md` is the thin Codex wrapper that imports `AGENTS.md`.
- This file is the human-facing guide for running career-ops workflows from Codex.

## Interactive Codex

Start Codex in the repository root:

```bash
cd career-ops
codex
```

Codex may not expose a native `/career-ops` slash command. When it does not, ask for the same workflow in plain language:

```text
Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123
Run the career-ops scan mode and summarize new matches.
Run the career-ops pipeline mode for data/pipeline.md.
Run the career-ops pdf mode for the latest evaluated role.
Run the career-ops email mode for the latest evaluated role. Draft only; never sends, submits, or clicks.
Run the career-ops tracker mode and summarize the current statuses.
```

## Mail-First Workflows

Use the Gmail CLI lane before opening a browser:

```bash
npm run mail:latest
npm run mail:search -- "from:recruiter OR subject:follow up"
npm run mail:auth
```

The Gmail scripts resolve OAuth files from the current repository root first, then the mirrored workspace root on this machine. If both are missing, set `GMAIL_AUTH_ROOT`, `GMAIL_CREDENTIALS_PATH`, and `GMAIL_TOKEN_PATH`.

LinkedIn DM automation is still browser-only here unless a partner-scoped API is available, so keep that lane separate from the Gmail/API path.

## One-shot workers

For single commands or batch workers, use `codex exec`:

```bash
codex exec "Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123"
codex exec "Run career-ops scan mode in this repo and summarize new matches."
codex exec "Run career-ops pipeline mode for data/pipeline.md."
codex exec "Run career-ops pdf mode for the latest evaluated role."
codex exec "Run career-ops email mode for the latest evaluated role. Draft only; do not send, submit, or click anything."
codex exec "Run career-ops tracker mode and summarize the current statuses."
```

## Notes

- If your Codex environment exposes slash commands, the shared `/career-ops` router semantics still apply.
- If it does not, use the same mode names through prompts or `codex exec`.
- Browser-heavy flows such as `scan`, `pipeline`, and `apply` still depend on Playwright browser tools being available in the active agent setup.

## Browser Automation Order

Use the least invasive lane that can finish the task:

1. Gmail / API / CLI first.
2. Headless Playwright MCP second.
3. Visible Chrome only for flows that truly need human login, CAPTCHA, or extension-backed state.

This repo now ships a project-level `.mcp.json` that registers `@playwright/mcp` in headless mode, so future agents can discover a browser lane without taking over the desktop. That keeps scan, pipeline, liveness, and many application-form tasks off the user's visible screen.

If a site blocks headless automation or requires an already-authenticated personal session, fall back deliberately:

- Use the Gmail/API lane for outreach and inbox work.
- Use `scan.extractor: cli` when you want compact headless page extraction from `browser-extract.mjs`.
- Use visible Chrome only when a real human session is unavoidable.

See [docs/BROWSER_AUTOMATION.md](BROWSER_AUTOMATION.md) for the full lane matrix, headed-vs-headless tradeoffs, and MCP config examples.
Use `npm run browser:lane -- ...` when you want to switch the repo's future-agent browser defaults without editing files by hand.
