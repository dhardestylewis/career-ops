# Career-Ops for Codex

Read `CLAUDE.md` for all project instructions, coordination, and behavioral rules. They apply equally to Codex.

Key points:
- The canonical resume attachment is the tracked repo asset at:
  `data/assets/resume-dhl-20260630-causal-mle.pdf`
- Do not fall back to older PDFs unless the user explicitly says the resume changed.
- Reuse the existing modes, scripts, templates, and tracker flow - do not create parallel logic.
- Prefer safe durable action over narration. If a change can be made safely in the repo, make it and record it instead of only describing the next step.
- Store user-specific customization in `config/profile.yml`, `modes/_profile.md`, or `article-digest.md` - never in `modes/_shared.md`.
- For outreach, do not send until the contact dossier is complete and source-backed; prefer public-work hooks for professors and former instructors.
- Before sending outreach, check the recipient's current LinkedIn profile or organization page. If they moved, rewrite the note as a reconnect or current-role note, not an active-role follow-up.
- Before any outreach about work, money, gigs, contracts, or jobs, check the recipient against the South Park Commons pando member directory first. If the PDF/export gives a clean no-match and the contact is not SPC-adjacent, that is enough to proceed; use Slack only as a tie-breaker when the directory result is ambiguous, OCR-noisy, or the contact looks SPC-affiliated. If the check is still unclear, switch to a non-work reconnect or mark the contact blocked for that lane.
- Before drafting or sending any LinkedIn outreach, inspect the live thread history and `data/outreach/log.md`. If the recipient already has prior outbound or inbound messages, treat the next touch as a follow-up or reconnect and continue the existing thread. Never rewrite an existing thread as if it were a fresh intro.
- Existing relationships are a separate authorization gate, not a channel choice. Treat 1st-degree contacts, active/prior threads, prior replies, former colleagues/classmates/instructors, warm intros, customers/partners/advisors, and organizations with shared history as protected. If relationship status is unclear, stop at draft-only.
- Check `C:\Users\dhl\.codex\outreach-touchpoints.tsv` and the wide review views at `C:\Users\dhl\.codex\outreach-touchpoint-matrix.tsv` / `C:\Users\dhl\.codex\outreach-touchpoints.xlsx` when reviewing prior contact. Blank exact touch dates are still protected relationship evidence, not a cold-history signal.
- Protected people and organizations require the user to screen the exact recipient, organization, lane, channel, and final copy in the current chat and explicitly approve that exact message. Batch goals, general send permission, old approvals, and instructions to use an existing thread do not count. Approval is one-time, expires within 24 hours, and is invalidated by any change.
- The protected-relationship gate applies to replies, follow-ups, reconnects, email, LinkedIn, forms, calendar-related messages, alternate contacts, and fallback/company inboxes. Run `npm run outreach:audit -- "Recipient or Organization"`; exit code `4` is a hard manual-approval stop.
- Keep job-seeking and Homecastr hiring-source outreach in separate lanes. Do not combine candidate asks and talent/source asks in the same message, thread, or packet.
- For every LinkedIn DM, connection note, or invite note, never send from an already-open conversation unless it is the exact requested recipient. Verify the recipient in two independent UI signals before typing and again before sending, and treat missing `Pending` or send confirmation as unsent.
- For live email and calendar threads, open the full thread and read the newest human message before replying. Do not infer booking, confirmation, or rescheduling state from the subject line or a search preview alone.
- For scheduling, do not describe a proposed time as available, mutual, free, or calendar-vetted unless you have checked live calendar data for the relevant calendar(s) and exact time window, using a calendar connector or `npm run calendar:freebusy -- --time-min ... --time-max ...`. Gmail-visible invites, snippets, cached mail, or search results are not a calendar availability check; if live Calendar access is unavailable, say that plainly and label any slot as only "not contradicted by Gmail/invite search."
- Personal calendar invites and social invites are hands-off unless the user explicitly asks you to RSVP, decline, or reply.
- Treat every path under `data/outreach/` as local-only working state. Do not stage or commit those files in a PR; if you need shareable examples, use `examples/` with redacted fixture data instead.
- Login state is not permanent across fresh sessions. If Chrome already has authenticated LinkedIn, Pando, or Superhuman tabs open, keep those tabs alive and use the Chrome profile first; use the in-app browser only as a backup Gmail surface.
- You are explicitly authorized to auto-submit applications on the user's behalf when fill rate is 100%. Before submitting, ensure you capture a full-page screenshot and save the JSON payload to the archive DB.

For Codex-specific setup, see `docs/CODEX.md`.

Wording preference:
- For future agent handoffs, docs, and outreach copy, avoid using `route` or `family` except when quoting an existing file name, URL, schema key, official title, or source text. Prefer `path`, `channel`, `source`, `dataset`, `field set`, `thread`, or `collection` as appropriate.
