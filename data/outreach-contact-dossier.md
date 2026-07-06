# Outreach Contact Dossier

Use this before any live send or follow-up. If you cannot fill it from actual source material, the action state is `research`, not `ready`.

## Required Questions

1. Who exactly is this person, and what is our relationship?
2. What was the last real touch, and when did it happen?
3. Why am I reaching out now?
4. What exact hook about them is specific enough to feel personal?
5. What exact proof point about me makes the ask credible?
6. What is the smallest sensible ask for this channel?
7. What should I avoid mentioning because it is stale, too much, or risky?
8. What is the send state and follow-up rule if they do not reply?

## Minimum Source Set

- Gmail: latest thread, prior thread if it exists, exact subject lines, dates, asks, replies, commitments, introductions, and attachments.
- LinkedIn: profile headline, current role, recent posts or activity, DM history, mutual connections, and obvious role changes.
- Public web: 1 to 2 concrete artifacts only, such as a paper, talk, lab page, article, editorship, lecture, or publication, with title and date.
- Internal context: one matching proof point from `data/cv.md`, `article-digest.md`, project notes, or the repo that directly supports the ask.
- Before sending, verify the recipient's current LinkedIn profile or organization page. If they have moved, rewrite the note as a reconnect or current-role note instead of an active-role follow-up.

## South Park Commons Gate

Before any outreach about work, money, gigs, contracts, or jobs, check the recipient against the South Park Commons pando member directory and South Park Commons Slack.

- If the person is SPC-affiliated, do not use a work pitch for that contact.
- If the check is unclear or unavailable, treat the contact as `blocked` for the work pitch until the affiliation is resolved.
- If you still want to reach out, use only a non-work reconnect, academic, or community angle.
- Record the result in the dossier so later agents do not have to re-check the same person.
- Treat a blank `spc_affiliation` field as unchecked, not as external approval.

## Annotation Schema

```text
contact:
relationship:
lane:
source_refs:
last_touch:
why_now:
hook:
proof_point:
ask:
avoid:
status:
next_followup:
spc_affiliation:
spc_checked_at:
```

## Send / No-Send Gate

- Send only if `why_now`, `hook`, `proof_point`, and `ask` are filled from sources.
- Do not send if the hook is generic, the relationship is unclear, or the last touch is unknown.
- For warm contacts, require at least one prior thread or shared history plus one current reason to reach out.
- For cold contacts, require one strong public-work hook and one very small ask.
- For professors and former instructors, prefer a public-work reference when one exists. Good hooks include a paper, talk, lecture, lab page, blog post, or editorship.
- If a contact has changed roles, treat that as a reconnect signal and rewrite the opener around the new role.
- If a reply changes strategy or is ambiguous, pause and notify the user instead of guessing.

## Prior Labs reconnect

contact: Noah Hollmann
relationship: prior warm company contact from the Prior Labs interview thread
lane: hiring-manager
source_refs: Gmail thread `Pre-Meeting Brief for Interview with Prior Labs` (Feb 26, 2026); Prior Labs careers page; Prior Labs about page; Noah Hollmann LinkedIn; Prior Labs LinkedIn company page
last_touch: 2026-02-26
why_now: Prior Labs is hiring again, and the current roles line up with my production ML, evaluation, and distributed-systems background.
hook: TabPFN and tabular foundation models, especially the bridge from research into dependable production systems.
proof_point: production ML, evaluation/reliability, distributed systems, and geospatial/time-series forecasting
ask: ask whether Noah is still the right technical owner for the current hiring push, or who I should speak with next
avoid: sounding like a cold application blast, dumping a full resume, or assuming SPC affiliation
status: research
next_followup: hold until SPC affiliation is checked; if cleared, send a short reconnect note and then wait 5 business days before any nudge
spc_affiliation: unchecked
spc_checked_at:
