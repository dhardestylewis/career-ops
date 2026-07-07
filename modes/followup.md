# Mode: followup -- Follow-up Cadence Tracker

> This mode is job-search specific. For GTM lead follow-ups, use `modes/gtm-followup.md`.

## Purpose

Track follow-up cadence for active applications and live outreach threads. Flag overdue follow-ups, extract contacts from notes, and generate tailored follow-up email/LinkedIn drafts using report context or the outreach queue.

## Inputs

- `data/tracker/applications.md` - Application tracker
- `data/follow-ups.md` - Follow-up history (created on first use)
- `data/outreach/queue.tsv` - Active outreach queue generated from the multi-lane ledger
- `data/outreach/log.md` - Sent outreach history and live thread context
- `data/outreach/drafts.md` - Draft-only outreach workspace and LinkedIn-first reconnect notes
- `data/outreach/contact-dossier.md` - Per-contact source-backed dossier and send gate
- `reports/` - Evaluation reports (for context in drafts)
- `config/profile.yml` - User profile (name, identity)
- `data/cv.md` - CV for proof points in drafts

## Step 1 - Run Cadence Script

Execute:

```bash
node src/dataOps/followup-cadence.mjs
```

Parse the JSON output. It contains:

| Key | Contents |
|-----|----------|
| `metadata` | Analysis date, total tracked, actionable count, overdue/urgent/cold/waiting counts |
| `entries` | Per-application: company, role, status, days since application, follow-up count, urgency, next follow-up date, extracted contacts, report path |
| `cadenceConfig` | Cadence rules (applied: 7 days, responded: 3 days, interview: 1 day) |

If no actionable entries, tell the user:

> "No active applications to follow up on. Apply to some roles first with `/career-ops` and come back when they're aging."

Then run the outreach ledger when live outreach is in scope:

```bash
node src/dataOps/outreach-ledger.mjs
```

The ledger builds `data/outreach/universe.tsv` and `data/outreach/queue.tsv`. Treat `data/outreach/queue.tsv` as the active outreach work queue and sort by `action_state`:

- `followup_due` - send the lane-specific follow-up now, but only once the recorded `next_followup` date is due
- `ready` - send the first touch if the contact is approved, unblocked, and the dossier is complete
- `research` - find the right route before drafting
- `blocked` - pause for human judgment or route access

## Step 2 - Display Dashboard

Show a cadence dashboard sorted by urgency (urgent > overdue > waiting > cold):

```
Follow-up Cadence Dashboard - {date}
{N} applications tracked, {N} actionable

| # | Company | Role | Status | Days | Follow-ups | Next | Urgency | Contact |
```

Use visual indicators:
- **URGENT** - respond within 24 hours (company replied)
- **OVERDUE** - follow-up is past due
- **waiting (X days)** - on track, follow-up scheduled
- **COLD** - 2+ follow-ups sent, suggest closing

## Outreach Queue Overlay

For rows in `data/outreach/queue.tsv`, present the same kind of dashboard with the lane fields visible:

```
Outreach Queue - {date}
| Lane | Contact | Channel | Status | Response | Next Follow-up | Action |
```

Prioritize by `action_state`:

- `followup_due` - send now
- `ready` - send the first touch or discovery note if the dossier is complete
- `ready` still requires `node src/dataOps/outreach-preflight.mjs --packet <send-packet-path>` to pass before anything is actually sent
- `research` - find the right route first
- `blocked` - stop and ask for judgment or access

Use the same cadence discipline unless the lane notes say otherwise:

- First follow-up: 5 business days after the send by default, and never sooner than 3 business days
- Second follow-up: 5 business days after the first follow-up by default, and never sooner than 3 business days
- After that, stop unless the user explicitly wants another pass
- For no-response outreach, auto-schedule the next follow-up on that same conservative business-day cadence rather than calendar days.

Lane-specific reminders:

- Professor / former instructor: reconnect on the shared academic context or a specific public work
- Alumni / career services: ask for direction or the best contact path
- Recruiter: surface screening facts early
- Hiring manager: reference the team problem or role fit
- Lab / researcher: name the topic or paper first
- Nonprofit / public-sector: lead with the mission or program
- Dormant warm tie: revive the prior thread, do not restart cold
- Founder / ecosystem: bridge first, bio second
- South Park Commons-affiliated or unclear: do not send a work, money, gigs, contracts, or jobs pitch; use a non-work reconnect or pause for judgment.
- If Chrome already has LinkedIn, Pando, or Superhuman authenticated, keep working from that profile first and preserve those tabs as handoff state. Login state is not permanent across brand-new sessions; use the in-app browser only as a backup Gmail surface.

## Step 3 - Generate Follow-up Drafts

For each **overdue** or **urgent** entry only:

1. Read the linked dossier (`data/outreach/contact-dossier.md` or the queue notes) for source refs, last touch, why now, hook, proof point, ask, avoid, next follow-up, and South Park Commons affiliation if the pitch is work-related.
2. Read the linked report (`reportPath` from JSON) for company context
3. Read `data/cv.md` for proof points
4. Read `config/profile.yml` for candidate name and identity

### Email Follow-up Framework (first follow-up, followupCount == 0)

Generate a 3-4 sentence email:

1. **Sentence 1:** Reference the specific role + when you applied. Be specific - mention the company name and role title.
2. **Sentence 2:** One concrete value-add from the report's Block B match or a proof point from `data/cv.md`. Quantify if possible.
3. **Sentence 3:** Soft ask + availability. Offer a specific time window ("this week" or "next Tuesday").
4. **Sentence 4 (optional):** Brief mention of a relevant recent project or achievement.

**Rules:**
- Professional but warm, NOT desperate
- **NEVER** use "just checking in", "just following up", "touching base", or "circling back"
- Lead with value, not with the ask
- Reference something specific to THAT company (from report Block A)
- Keep under 150 words
- Include a subject line
- Use the candidate's name from `config/profile.yml`

**Example tone:**
> Subject: Re: Senior PHP/Laravel Developer - IxDF
>
> Hi [contact name or "team"],
>
> I submitted my application for the Senior PHP/Laravel Developer role on April 7th. I wanted to share that my production Laravel app (Barbeiro.app - 120 models, 315 API endpoints, full test suite) closely mirrors the TDD-driven culture described in the posting.
>
> I'd love to discuss how my 15 years of PHP experience and hands-on AI tooling workflow could contribute to IxDF's platform. Would any time this week work for a brief conversation?
>
> Best,
> [Name]

### LinkedIn Follow-up (if no email contact found)

Reuse the contacto framework: 3 sentences, 300 character max.
- Hook specific to company -> proof point -> soft ask
- Check `data/outreach/template-evidence.md` for the exact short-form variants before drafting.
- Suggest the user run `/career-ops contacto {company}` to find the right person first

### Second Follow-up (followupCount == 1)

Shorter than first (2-3 sentences). Take a **new angle**:
- Share a relevant insight, article, or project update
- Don't repeat the first follow-up's content
- Still reference the role specifically

### Cold Application (followupCount >= 2)

Do NOT generate another follow-up. Instead suggest:
> "This application has had {N} follow-ups with no response. Consider:
> - Updating status to `Discarded` if the role seems filled
> - Trying a different contact via `/career-ops contacto`
> - Keeping in `Applied` status but deprioritizing"

### Response Action Matrix

Keep the action state explicit for the next agent:

| Reply state | Next action | Follow-up handling |
|---|---|---|
| Simple yes/no or scheduling question | Reply directly with a short answer | Do not draft a new follow-up; stay in the thread |
| Strategic or ambiguous reply | Pause and notify the user | Wait for human judgment before answering |
| No response | Schedule the next follow-up automatically | Use the conservative business-day cadence and do not send before the recorded `next_followup` date |

## Step 4 - Present Drafts

For each draft, show:

```
## Follow-up: {Company} - {Role} (#{num})

**To:** {email or "No contact found - run `/career-ops contacto` first"}
**Subject:** {subject line}
**Days since application:** {N}
**Follow-ups sent:** {N}
**Channel:** Email / LinkedIn

{draft text}
```

## Step 5 - Record Follow-ups

After the user reviews and says they've sent a follow-up, record it:

1. If `data/follow-ups.md` doesn't exist, create it:
   ```markdown
   # Follow-up History

   | # | App# | Date | Company | Role | Channel | Contact | Notes |
   |---|------|------|---------|------|---------|---------|-------|
   ```

2. Append a row with:
   - `#` = next sequential number in the follow-ups table
   - `App#` = application number from tracker
   - `Date` = today's date
   - `Company` = company name
   - `Role` = role title
   - `Channel` = Email / LinkedIn / Other
   - `Contact` = who it was sent to
   - `Notes` = brief note (e.g., "First follow-up, referenced Barbeiro.app")

3. Optionally update the Notes column in `data/tracker/applications.md` with "Follow-up {N} sent {YYYY-MM-DD}"

**IMPORTANT:** Only record follow-ups the user confirms they actually sent. Never record a draft as sent.

## Step 6 - Summary

After showing all drafts, summarize:

> **Follow-up Dashboard** ({date})
> - {N} applications being tracked
> - {N} overdue - drafts generated above
> - {N} urgent - respond today
> - {N} waiting - next follow-up dates shown
> - {N} cold - consider closing
>
> Review the drafts above and tell me which ones you've sent so I can record them.

## Cadence Rules Reference

| Status | First follow-up | Subsequent | Max attempts |
|--------|----------------|------------|-------------|
| Applied | 7 days after application | Every 7 days | 2 (then mark cold) |
| Responded | 1 day (urgent reply) | Every 3 days | No limit |
| Interview | 1 day after (thank-you) | Every 3 days | No limit |

These defaults can be overridden via `node src/dataOps/followup-cadence.mjs --applied-days N`.
