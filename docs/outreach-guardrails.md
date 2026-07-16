# Outreach Guardrails

Date: 2026-07-05

This file is job-search specific. For GTM lead, customer, partner, or advisor outreach, use `docs/gtm-outreach-guardrails.md`.

This is the canonical guardrails block for all outreach work in this worktree. Future agents should read this first, then read the template pack and the relevant mode.

## Send Gate

- Draft first.
- Relationship authorization comes before channel routing. A 1st-degree connection, active/prior thread, prior reply, former colleague/classmate/instructor, warm intro, customer/partner/advisor relationship, or existing relationship with the organization is protected.
- Audit both the person and organization. If either audit exits `4`, or if `relationship_status` is `established` or `unknown`, stop at draft-only. Alternate people, email addresses, channels, and company/fallback inboxes inherit the organization's protected status.
- For an established relationship, show the user the exact recipient, organization, lane, channel, and final copy in the current chat. Wait for explicit approval of that exact message. General batch authorization, private-channel rules, old approvals, and "continue the thread" are not approval.
- Record approval only after the user approves in the current chat: `npm run outreach:approve -- grant --recipient "Name" --organization "Org" --lane "candidate-seeking" --channel "Channel" --body-file <exact-body-file> --chat-reference "<current task/date>" --i-have-current-chat-approval`. Put the returned `approval_id` in the dossier. It expires within 24 hours, is exact-copy/scope only, and is atomically consumed on send.
- Before you type into Gmail, confirm that both `data/outreach/log.md` and `data/outreach/drafts.md` exist. If either file is missing, restore it before sending anything live.
- Before drafting, fill `data/outreach/contact-dossier.md` and `data/outreach/template-evidence.md` from actual source material. If you cannot name the last real touch, current role or public hook, and one concrete proof point, stop at `research`.
- Do not send anything until the user has approved the recipient batch, unless the user explicitly asks for a specific send.
- Before any live send or follow-up, run `npm run outreach:audit -- "Recipient Name"` and again for the organization. If it exits `2`, do not send a new intro; if it exits `3`, resolve the existing workflow; if it exits `4`, require exact current-chat approval.
- If the only identifier you have is an email address, audit that too. An archive-only hit is not a green light.
- Before any follow-up, check the dossier's `next_followup`. If it is a future date or says to wait for a reply / acceptance, the thread is `hold` and the send stops.
- If thread context is unclear, stop at `draft only`.
- Never "fix" a bad send with a second apology or self-correction unless the user explicitly asks for it.
- If the new draft only restates the last outbound touch with different wording, stop at draft-only. A cosmetic rewrite is not a new send.

## Thread State

- `new outreach` if there is no inbound response.
- `reply` only if there is a real visible reply from the recipient.
- `hold` if the thread is ambiguous, stale, or not yet due for the next touch.
- Never use reply language like `Thanks`, `Following up`, or `Appreciate your reply` unless a real response is visible.

## Channel Routing

- Channel choice never grants send permission.
- `1st-degree` connection or active thread: DM only after the protected-relationship gate clears.
- `2nd-degree` or `3rd-degree`: use a note-style connection request, not DM.
- InMail stays off by default.
- Only use InMail when the user explicitly asks for it or no other route exists.

## Message Shape

- Hook on them or their work.
- Add one proof point about you.
- End with one small ask.
- Keep the first sentence specific.
- Keep the message short enough that it can be read in one glance.
- Avoid boilerplate process words like `routing`, `tightening`, `lane`, `quick update`, or `project pitch` unless they are directly supported by the source trail.
- For career-routing contacts like program staff, alumni office staff, or career-services staff, treat them as routers, not collaborators. Ask for specific names or an introduction, and attach the current resume if it helps them route you.
- For vendor, analyst, or market-intelligence front-door contacts, treat them as routers too. Ask for the right specialist, team, or intro rather than trying to turn the intake contact into the long-term relationship.

## Logging

- Log every live outbound touch in `data/outreach/log.md` before moving to the next recipient.
- Before classifying a recipient as cold, check `C:\Users\dhl\.codex\outreach-touchpoints.tsv` in addition to the protected registry and live thread sources. A touchpoint row with a blank exact timestamp is still relationship evidence; it is not clearance to send.
- Treat the Gmail sent folder as evidence, not the ledger. `data/outreach/log.md` is the source of truth for future agents.
- Re-run `npm run outreach:audit -- "Recipient Name"` after logging if the next step is unclear; the audit should now point to the existing thread instead of a fresh send.
- If the follow-up is just a paraphrase of the prior touch, do not log a new send. Wait for a real reply or a genuinely new angle.
- Keep the discovery trail in the appropriate TSV or note file so future agents can recover the context without reopening the browser session.
- Do not invent contact details, application links, or replies.

## Backup / Recovery

- Treat `docs/outreach-state-map.md` as the compact file map for the outreach workspace.
- After a live send burst or any major outreach-state change, run `npm run outreach:backup`.
- The default backup target is outside the repo at `C:\Users\<you>\.codex\backups\career-ops-outreach\`.
- Keep `credentials.json` and `token.json` machine-local or encrypted. Do not push them to GitHub.

## Commit Guard

- Before staging or committing, run `npm run guard:private-data`.
- The tracked `.githooks/pre-commit` hook runs the same check once `git config core.hooksPath .githooks` is set for this repo.
- If you need shareable fixtures, keep redacted copies under `examples/` instead of copying private user-layer data into GitHub.

## Discovery Sources

- LinkedIn feed and profile notes: `docs/linkedin-feed-observations.md`
- ATS / job boards: `portals.yml`, `data/state/scan-history.tsv`, `data/tracker/pipeline.md`
- Public writing / research / blog posts: `docs/outreach-discovery-sources.md`

## Defaults

- Use the smallest viable template.
- Prefer note-style intros for 2nd/3rd-degree contacts.
- Prefer direct DM only when the connection is already warm or first-degree.
- Keep the routing rule and send gate in this file, not in chat memory.
- Every dossier contact block must include `organization`, `channel`, `relationship`, `relationship_status` (`cold`, `established`, or `unknown`), and `approval_id` when approval is required. Missing or unknown relationship state is a hard stop.
