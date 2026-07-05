# Codex Setup

Career-Ops supports Codex through the root `AGENTS.md` file.

If your Codex client reads project instructions automatically, `AGENTS.md`
is enough for routing and behavior. Codex should reuse the same checked-in
mode files, templates, tracker flow, and scripts that already power the
Claude workflow.

## Prerequisites

- A Codex client that can work with project `AGENTS.md`
- Node.js 18+
- Playwright Chromium installed for PDF generation and reliable job verification
- Go 1.21+ if you want the TUI dashboard

## Install

```bash
npm install
npx playwright install chromium
```

## Recommended Starting Prompts

- `Evaluate this job URL with Career-Ops and run the full pipeline.`
- `Scan my configured portals for new roles that match my profile.`
- `Generate the tailored ATS PDF for this role using Career-Ops.`

## Routing Map

| User intent | Files Codex should read |
|-------------|-------------------------|
| Raw JD text or job URL | `modes/_shared.md` + `modes/auto-pipeline.md` |
| Single evaluation only | `modes/_shared.md` + `modes/oferta.md` |
| Multiple offers | `modes/_shared.md` + `modes/ofertas.md` |
| Portal scan | `modes/_shared.md` + `modes/scan.md` |
| PDF generation | `modes/_shared.md` + `modes/pdf.md` |
| Live application help | `modes/_shared.md` + `modes/apply.md` |
| Pipeline inbox processing | `modes/_shared.md` + `modes/pipeline.md` |
| Tracker status | `modes/tracker.md` |
| Deep company research | `modes/deep.md` |
| Training / certification review | `modes/training.md` |
| Project evaluation | `modes/project.md` |
| Live outreach / contact discovery | `modes/contacto.md` + `modes/followup.md` + outreach files |

The key point: Codex support is additive. It should route into the existing
Career-Ops modes and scripts rather than introducing a parallel automation
layer.

## Behavioral Rules

- Prefer safe durable action over narration. If Codex can make a change safely in the repo, it should make it and record it instead of only describing the next step.
- Treat raw JD text or a job URL as the full auto-pipeline path unless the user explicitly asks for evaluation only.
- Keep all personalization in `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, or `portals.yml`.
- Never verify a job’s live status with generic web fetch when Playwright is available.
- Never submit an application for the user.
- Never add new tracker rows directly to `data/tracker/applications.md`; use the TSV addition flow and `merge-tracker.mjs`.
- For browser-assisted outreach, prefer the Chrome profile first when LinkedIn, Pando, or Superhuman are already authenticated there. Treat those tabs as handoff state only; login state is not permanent across brand-new sessions. Use the in-app browser as a backup Gmail surface when needed.
- Before drafting or sending live outreach, refresh the latest branch/PR state and outreach ledger so you stay aligned with other agents working in parallel.
- Treat `data/outreach-operator-card.md` as the canonical outreach run sheet and `data/outreach-log.md` as the live-send ledger. Run the session preflight before any live send, then log it immediately.
- Keep the queue as the worklist, not a second source of truth.

## Outreach Handoff

If the task is live outreach, read this first before drafting or sending:

1. `data/outreach-operator-card.md`
2. `data/outreach-contact-dossier.md`
3. `data/outreach-drafts.md`
4. `data/outreach-targets.tsv`
5. `data/outreach-universe.tsv`
6. `data/outreach-queue.tsv`
7. `data/outreach-log.md`
8. `data/outreach-template-evidence.md`
9. `data/outreach-scripts.md`
10. `data/outreach-review.md`
11. `src/dataOps/outreach-ledger.mjs`

Rules:

- Keep the same skeleton everywhere: hook on them, one proof point, one small ask.
- Prefer the shortest viable lane-specific template from the evidence pack.
- Log each send immediately so a second agent cannot duplicate it.
- If a row is blocked, solve the route or pause for judgment instead of improvising around access friction.
- Do not send until the contact dossier is complete and source-backed.
- For professors and former instructors, prefer public work hooks when available.
- Before any outreach about work, money, gigs, contracts, or jobs, check the recipient against the South Park Commons pando member directory and South Park Commons Slack. If they are SPC-affiliated or the status is unclear, do not send the work pitch; use only a non-work reconnect or mark the row blocked for that lane.

Then follow the existing repo flow instead of inventing a new one.

## Verification

```bash
npm run verify

# optional dashboard build
cd dashboard && go build ./...
```
