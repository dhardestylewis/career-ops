# Outreach Guardrails

Date: 2026-07-05

This file is job-search specific. For GTM lead, customer, partner, or advisor outreach, use `docs/gtm-outreach-guardrails.md`.

This is the canonical guardrails block for all outreach work in this worktree. Future agents should read this first, then read the template pack and the relevant mode.

## Send Gate

- Draft first.
- Do not send anything until the user has approved the recipient batch, unless the user explicitly asks for a specific send.
- Before any live send or follow-up, run `npm run outreach:audit -- "Recipient Name"`. If it exits `2`, do not send a new intro; if it exits `3`, resolve the existing draft / research / blocked state first.
- Before any follow-up, check the dossier's `next_followup`. If it is a future date or says to wait for a reply / acceptance, the thread is `hold` and the send stops.
- If thread context is unclear, stop at `draft only`.
- Never "fix" a bad send with a second apology or self-correction unless the user explicitly asks for it.

## Thread State

- `new outreach` if there is no inbound response.
- `reply` only if there is a real visible reply from the recipient.
- `hold` if the thread is ambiguous, stale, or not yet due for the next touch.
- Never use reply language like `Thanks`, `Following up`, or `Appreciate your reply` unless a real response is visible.

## Channel Routing

- `1st-degree` connection or active thread: use DM.
- `2nd-degree` or `3rd-degree`: use a note-style connection request, not DM.
- InMail stays off by default.
- Only use InMail when the user explicitly asks for it or no other route exists.

## Message Shape

- Hook on them or their work.
- Add one proof point about you.
- End with one small ask.
- Keep the first sentence specific.
- Keep the message short enough that it can be read in one glance.
- For career-routing contacts like program staff, alumni office staff, or career-services staff, treat them as routers, not collaborators. Ask for specific names or an introduction, and attach the current resume if it helps them route you.

## Logging

- Log every live outbound touch in `data/outreach/log.md` before moving to the next recipient.
- Re-run `npm run outreach:audit -- "Recipient Name"` after logging if the next step is unclear; the audit should now point to the existing thread instead of a fresh send.
- Keep the discovery trail in the appropriate TSV or note file so future agents can recover the context without reopening the browser session.
- Do not invent contact details, application links, or replies.

## Discovery Sources

- LinkedIn feed and profile notes: `docs/linkedin-feed-observations.md`
- ATS / job boards: `portals.yml`, `data/state/scan-history.tsv`, `data/tracker/pipeline.md`
- Public writing / research / blog posts: `docs/outreach-discovery-sources.md`

## Defaults

- Use the smallest viable template.
- Prefer note-style intros for 2nd/3rd-degree contacts.
- Prefer direct DM only when the connection is already warm or first-degree.
- Keep the routing rule and send gate in this file, not in chat memory.
