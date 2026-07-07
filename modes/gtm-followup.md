# Mode: gtm-followup -- GTM Follow-Up Cadence

## Purpose

Track follow-up cadence for active GTM lead threads. Flag overdue follow-ups, extract contacts from notes, and generate tailored follow-up email or note drafts using source-backed context.

## Inputs

- `data/gtm-outreach-contact-dossier.md` - GTM dossier and send gate
- `data/gtm-outreach-scripts.md` - Draft templates
- `data/outreach/log.md` - Live send history and existing thread context
- `data/outreach/drafts.md` - Draft-only workspace when a thread already exists

## Step 1 - Check the Current State

- Run the existing outreach audit for the recipient before any live send or follow-up.
- If it finds a prior thread or prior send, continue there instead of opening a fresh intro.
- If it finds an unresolved draft or blocked state, fix that first.

## Step 2 - Prioritize the Queue

Use these states for GTM work:

- `followup_due` - send the next touch now
- `ready` - send the first touch if the dossier is complete
- `research` - gather more source material
- `blocked` - pause for human judgment or access

## Step 3 - Cadence Rules

- First follow-up: 5 business days after the send by default, and never sooner than 3 business days.
- Second follow-up: 5 business days after the first follow-up by default, and never sooner than 3 business days.
- After that, stop unless the user explicitly wants another pass.
- For hot inbound leads, respond the same day if possible. That is a reply rule, not a no-response follow-up rule.

## Step 4 - Drafting Rules

### First follow-up

- Name the company or context.
- Mention the original reason for reaching out.
- Add one new signal or proof point.
- Ask for one small next step.

### Second follow-up

- Use a new angle.
- Do not repeat the first note.
- Keep it shorter than the first follow-up.

### Warm thread nudge

- Re-anchor the prior context.
- Keep the tone light and specific.
- Do not restart cold.

## Step 5 - Response Handling

- Simple yes/no or scheduling question: reply directly and keep it short.
- Strategic or ambiguous reply: pause and notify the user.
- No response: schedule the next follow-up on the same conservative business-day cadence.

## Step 6 - Output

For each draft, show:

- Contact
- Company
- Channel
- Status
- Days since send or touch
- Follow-up count
- Next follow-up date
- Draft text

## Tone Rules

- Keep the first sentence specific.
- Use one proof point.
- Use one ask.
- No generic check-ins.
- No multi-paragraph recap.
