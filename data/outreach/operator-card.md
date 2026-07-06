# Outreach Operator Card

Date: 2026-07-05

Use this first if you are the next agent picking up live outreach.

## Current State

- The live LinkedIn send state has been verified.
- Sent: Li-Yun (James) Wang, 3Dtrees team, Kyle Baranko, Maxime Meilland, Vrushali Mundhe.
- Incident logged: Julia Kreutzer's LinkedIn thread received a wrong-recipient Accenture / Tim message on 2026-07-05. An apology was sent immediately. Keep that thread archived and do not reopen the lane unless the user explicitly asks.
- Blocked route: Apurva Singh due to LinkedIn verification / CAPTCHA.
- Google X / Bellwether was rejected after the late-stage process. Do not send a normal follow-up on the old role; only draft a re-engagement note if a warm Bellwether contact surfaces a clearly separate opening.
- Bellwether recruiter contact surfaced in Gmail: Gabriel Schook <schook@xwf.x.team>. Keep that thread separate from the rejected application and only use it for other X/Bellwether openings.
- Jack & Jill AI is a separate candidate-intake lane. Treat Jack as the job-seeker side and Jill as the company-side recruiter platform.
- Clera is not tracked in this repo. Treat it as external candidate-intake only if it is reintroduced as a live, separate lane.
- Recruiter discovery must use new companies only. Do not add more people from Harvey, Guardian, Elwood, Tech Holding, or AdAstra unless the user explicitly asks for a separate referral path.
- Exclude Databricks from the current recruiter batch per user instruction; keep it out of drafts and sends unless the user explicitly reopens that lane.
- Ignore Toptal entirely. Do not create, queue, revive, or route outreach to any Toptal contacts in future sessions.
- Harvey is the main company lane to keep watching. Prioritize `Software Engineer, Agents`, then `Data Scientist, Marketing`, with `Applied Legal Researcher` as a stretch backup.
- Current mailbox access in this session is only `daniel@homecastr.com` in Gmail. Columbia/UT inboxes are not connected here yet, and Superhuman mail is not exposed in this thread.
- Browser blocker note: if the extension-backed Chrome path is unstable, treat that as a separate blocker note and keep packet, dossier, and incident updates moving in-repo. Do not let browser troubleshooting replace the outreach safety work.

## Read Order

1. `modes/_profile.md`
2. `docs/outreach-guardrails.md`
3. `data/outreach/log.md`
4. `data/outreach/template-evidence.md`
5. `data/outreach/scripts.md`
6. `data/outreach/review.md`

## Operating Rule

- Use one hook, one proof point, one ask.
- Keep LinkedIn short and email only when more context is needed.
- Do not send if the path is blocked or the message needs more than one proof point.
- Stage every live send in `data/outreach/*send-packet.md` and run `node src/dataOps/outreach-preflight.mjs --packet <path>` before pasting anything into a composer.
- If preflight fails, stop. Re-open the dossier and fix the packet before doing anything else.
- Preflight will block a packet that repeats a message already mirrored in `data/outreach/drafts.md` and recorded in `data/outreach/log.md`.
- Run the recipient-verification protocol before every paste and before every send: keep only one live composer open, match the current profile or thread name to the dossier `contact:` and send-packet `### Recipient`, confirm the greeting names that same person, then re-read the composer header plus first line once more before sending.
- If any recipient name mismatch appears, do not edit around it in-place. Clear or close the draft, reopen the dossier and packet, and restart verification from scratch.
- If a reply needs judgment, stop and notify the user.
- If there is no reply, use the first follow-up after 3 to 5 business days and the second after another 3 to 5 business days.

## What to Preserve

- Founder-style intros: lead with the bridge.
- Warm follow-ups: name the prior context first.
- Recruiter outreach: surface screening facts early.
- Hiring manager outreach: lead with the team problem.
- Peer/referral outreach: ask for curiosity, not a job.

## What Not To Do

- Do not use "just checking in", "touching base", or "circling back" as default openers.
- Do not stack multiple asks into one note.
- Do not improvise around CAPTCHA.
- Do not keep multiple live LinkedIn or email composers open while sending outreach.
- Do not copy text from one recipient packet into another recipient's composer, even temporarily.
- Do not re-send duplicates already recorded in the log.
- Do not reopen the rejected Bellwether interview as if it were still active.
- Do not draft outreach without first checking LinkedIn for current company/role when the contact could have moved.
