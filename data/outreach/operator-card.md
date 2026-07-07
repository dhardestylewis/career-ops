# Outreach Operator Card

Date: 2026-07-05

Use this first if you are the next agent picking up live outreach.

## Current State

- The live LinkedIn send state has been verified.
- Sent: Li-Yun (James) Wang, 3Dtrees team, Kyle Baranko, Maxime Meilland, Vrushali Mundhe.
- Blocked route: Apurva Singh due to LinkedIn verification / CAPTCHA.
- SPC gate is PDF-first: if the directory export gives a clean no-match and the contact is not SPC-adjacent, that is enough to proceed. Use live Slack/Pando only as a tie-breaker when the result is ambiguous, OCR-noisy, or the contact looks SPC-affiliated.
- Google X / Bellwether was rejected after the late-stage process. Do not send a normal follow-up on the old role; only draft a re-engagement note if a warm Bellwether contact surfaces a clearly separate opening.
- Bellwether recruiter contact surfaced in Gmail: Gabriel Schook <schook@xwf.x.team>. Keep that thread separate from the rejected application and only use it for other X/Bellwether openings.
- Jack & Jill AI is a separate candidate-intake lane. Treat Jack as the job-seeker side and Jill as the company-side recruiter platform.
- Clera is not tracked in this repo. Treat it as external candidate-intake only if it is reintroduced as a live, separate lane.
- Recruiter discovery must use new companies only. Do not add more people from Harvey, Guardian, Elwood, Tech Holding, or AdAstra unless the user explicitly asks for a separate referral path.
- Exclude Databricks from the current recruiter batch per user instruction; keep it out of drafts and sends unless the user explicitly reopens that lane.
- Ignore Toptal entirely. Do not create, queue, revive, or route outreach to any Toptal contacts in future sessions.
- Harvey is the main company lane to keep watching. Prioritize `Software Engineer, Agents`, then `Data Scientist, Marketing`, with `Applied Legal Researcher` as a stretch backup.
- Current mailbox access in this session is only `daniel@homecastr.com` in Gmail. Columbia/UT inboxes are not connected here yet, and Superhuman mail is not exposed in this thread.

## Read Order

1. `modes/_profile.md`
2. `data/outreach/log.md`
3. `data/outreach/template-evidence.md`
4. `data/outreach/scripts.md`
5. `data/outreach/review.md`

## Operating Rule

- Use one hook, one proof point, one ask.
- Keep LinkedIn short and email only when more context is needed.
- Do not send if the path is blocked or the message needs more than one proof point.
- Geo gate: before any work outreach or application, confirm the role is feasible from the user's accepted locations. London, Paris, New York City, and San Francisco are okay. Country-specific or city-specific roles outside those locations, and hybrid/on-site roles outside the user's geography, are blocked unless the user explicitly approves relocation or in-country presence.
- Stage every live send in `data/outreach/*send-packet.md` and run `node src/dataOps/outreach-preflight.mjs --packet <path>` before pasting anything into a composer.
- If preflight fails, stop. Re-open the dossier and fix the packet before doing anything else.
- Preflight will block a packet that repeats a message already mirrored in `data/outreach/drafts.md` and recorded in `data/outreach/log.md`.
- Never send a fresh outreach packet to a recipient who already has a `Sent` row in `data/outreach/log.md` unless the new message is a reply, a bounce-correction, or a cadence-eligible follow-up.
- Before any new touch, confirm the recipient's latest live outbound in `data/outreach/log.md` and the mailbox itself. Queue / next-batch / draft views can lag; if the mailbox shows any send within the last 5 business days, do not treat the lane as open for another first-touch.
- If a reply needs judgment, stop and notify the user.
- If there is no reply, use 5 business days by default for the first and second follow-up, and never send a no-response follow-up before 3 business days have passed.

## What to Preserve

- Founder-style intros: lead with the bridge.
- Warm follow-ups: name the prior context first.
- Recruiter outreach: surface screening facts early.
- Hiring manager outreach: lead with the team problem.
- Peer/referral outreach: ask for curiosity, not a job.
- Location-bound work roles must be checked before send; if the recruiter response suggests the user is not in an accepted location, stop and mark the lane blocked instead of improvising a pitch.

## What Not To Do

- Do not use "just checking in", "touching base", or "circling back" as default openers.
- Do not stack multiple asks into one note.
- Do not improvise around CAPTCHA.
- Do not re-send duplicates already recorded in the log.
- Do not use queue / next-batch as the only proof that a contact is unsent; confirm against the live mailbox and the ledger before drafting or sending.
- Do not reopen the rejected Bellwether interview as if it were still active.
- Do not draft outreach without first checking LinkedIn for current company/role when the contact could have moved.
