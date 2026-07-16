# GTM Outreach Guardrails

Date: 2026-07-06

This is the parallel guardrails block for GTM lead, customer, and partner outreach.
It is the fork of the job-search outreach rules, not a copy of them.

## Send Gate

- Draft first.
- Relationship authorization comes before channel routing. Treat 1st-degree contacts, live/prior threads, prior replies, warm/shared history, customers, partners, advisors, and organizations with an existing relationship as protected.
- Run `npm run outreach:audit -- "Recipient"` and again for the organization. Exit `4`, `relationship_status: established`, or `relationship_status: unknown` means draft-only until the user approves the exact recipient, organization, GTM lane, channel, and final copy in the current chat.
- A batch goal, generic send permission, old approval, or instruction to reply in-thread is not approval. Approval is one-time, expires within 24 hours, and is invalidated by any change. Alternate contacts and fallback/company inboxes inherit organization protection.
- Do not send until the contact dossier is complete and source-backed.
- Do not send until the dossier can point to the full live thread or DM history, at least one current public artifact, and one concrete proof point that supports the ask.
- Before any live send or follow-up, run the existing outreach audit for the recipient. If it finds a prior thread or prior send, continue there instead of opening a fresh intro.
- Before any follow-up, check the dossier's `next_followup`. If it is a future date or says to wait for a reply / acceptance, treat the thread as `hold` and do not send yet.
- If the current role, company, or context has changed, rewrite the note as a reconnect or current-role note.
- If the message needs more than one proof point, shorten it.
- Keep the main queue to direct-fit operators, owners, investors, and routing contacts. If the account is only adjacent through cooling hardware, power equipment, or another supplier layer, move it to hold instead of the active queue.

## Thread State

- `new outreach` if there is no visible reply.
- `reply` only if there is a real, visible response.
- `hold` if the thread is ambiguous, stale, blocked, or not yet due for the next touch.
- Never use reply language like `thanks`, `following up`, or `appreciate your reply` unless a real response is visible.

## Contact Routing

- Channel choice never grants send permission.
- 1st-degree or active thread: reply in thread only after the protected-relationship gate clears.
- 2nd/3rd-degree: use a note-style connect or a short email opener.
- Inbound lead: acknowledge quickly, then qualify with one clear next step.
- Customer or partner: route toward fit, timing, or next-step discovery.
- Advisor or operator: lead with the bridge and keep the ask small.

## Message Shape

- Hook on the recipient, their role, or the current trigger.
- Add one proof point about the work, product, or system.
- End with one small ask.
- Keep the first sentence specific.
- Keep the whole message short enough to read in one glance.
- Avoid boilerplate process words like `routing`, `tightening`, `lane`, or `quick update` unless the source trail uses them naturally.

## Discovery Sources

- CRM notes or prior thread context.
- LinkedIn profile, current role, and recent activity.
- Public company site, product page, release note, talk, article, or case study.
- Internal proof point from the deck, demo, notes, or product evidence.

## VC / Fundraising Boundary

- If the target is an investor, allocator, or fundraising advisor, do not use this fork.
- Route that work to `docs/homecastr-vc-agent-handoff.md` and keep the ask to investor feedback, fit, or a call only.

## Defaults

- Use the smallest viable template.
- Prefer direct reply for warm threads only after exact current-chat approval clears the protected-relationship gate.
- Prefer a short note for cold 2nd/3rd-degree contacts.
- Do not lead with a full background dump.
- Do not send mass-blast style outreach.
- Every lead block must include `organization`, `channel`, `relationship`, `relationship_status` (`cold`, `established`, or `unknown`), and `approval_id` when required. Missing or unknown relationship state is a hard stop.

## Job-Search Boundary

- If the work is actually job search, use the original outreach docs.
- If the work is GTM, customer, partner, or lead oriented, use this fork and the GTM script pack.
