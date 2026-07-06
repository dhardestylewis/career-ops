# Outreach Guardrails

Date: 2026-07-05

This is the canonical guardrails block for all outreach work in this worktree. Future agents should read this first, then read the template pack and the relevant mode.

## Send Gate

- Draft first.
- Do not send anything until the user has approved the recipient batch, unless the user explicitly asks for a specific send.
- If thread context is unclear, stop at `draft only`.
- Never "fix" a bad send with a second apology or self-correction unless the user explicitly asks for it.
- Before any live send, stage the exact outbound copy in `data/outreach/*send-packet.md` and run `node src/dataOps/outreach-preflight.mjs --packet <path>`.
- A failed preflight is a hard stop. Do not improvise in the browser composer after a failure.

## Thread State

- `new outreach` if there is no inbound response.
- `reply` only if there is a real visible reply from the recipient.
- `hold` if the thread is ambiguous or stale.
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

## Logging

- Log every live outbound touch in `data/outreach/log.md` before moving to the next recipient.
- Keep the discovery trail in the appropriate TSV or note file so future agents can recover the context without reopening the browser session.
- Do not invent contact details, application links, or replies.
- If a send misfire ever happens, archive the thread, log the incident in the operator card, and tighten the packet or dossier before any further outreach that session.

## Preflight Requirements

- The send packet must contain one `### Recipient Name` block per outbound note.
- The greeting in the message body must match that recipient exactly.
- The body must not contain another recipient's name from the same packet.
- Every sendable contact must have a matching `contact:` block in `data/outreach/contact-dossier.md` with `status: ready...`, `why_now`, `hook`, `proof_point`, and `ask` filled from sources.
- Any work-related pitch also needs recorded `spc_affiliation` and `spc_checked_at` values before preflight can pass.

## Discovery Sources

- LinkedIn feed and profile notes: `docs/linkedin-feed-observations.md`
- ATS / job boards: `portals.yml`, `data/state/scan-history.tsv`, `data/tracker/pipeline.md`
- Public writing / research / blog posts: `docs/outreach-discovery-sources.md`

## Defaults

- Use the smallest viable template.
- Prefer note-style intros for 2nd/3rd-degree contacts.
- Prefer direct DM only when the connection is already warm or first-degree.
- Keep the routing rule and send gate in this file, not in chat memory.
