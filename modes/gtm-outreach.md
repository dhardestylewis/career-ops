# Mode: gtm-outreach -- GTM Lead Outreach

> Apply `voice-dna.md` if present. Keep the tone crisp, specific, and human.

This mode is the GTM fork of the outreach system. Use it for lead, customer, partner, advisor, or ecosystem outreach, not for job search.

## When to Use

- The user wants to reach a lead, prospect, customer, partner, advisor, or operator.
- The user wants an outbound note for a CRM lead, warm referral, inbound response, or strategic reconnect.
- The user wants wording, channel choice, and a follow-up plan for a GTM thread.
- If the target is investor or fundraising related, route it to `docs/homecastr-vc-agent-handoff.md` instead of this mode.

## When Not to Use

- The user is doing job search or application outreach. Use the original outreach modes for that.
- The user does not have any source-backed reason to contact the person yet.

## Workflow

1. Identify the lead type.
   - Inbound lead
   - Cold outbound prospect
   - Warm intro or reconnect
   - Partner or ecosystem contact
   - Advisor or operator

2. Classify the persona.
   - Decision maker
   - Champion
   - Operator
   - Router
   - Technical evaluator
   - Community lead

3. Build the dossier using `data/gtm-outreach-contact-dossier.md`.
   - If you cannot fill `source_refs`, `thread_history`, `public_artifacts`, `internal_proof_point`, `why_now`, `hook`, `proof_point`, and `ask` from actual sources, stop at `research`.

4. Translate job-search habits into GTM wording using `data/gtm-outreach-translator.md`.

5. Draft from `data/gtm-outreach-scripts.md`.

6. Keep the message to one hook, one proof point, and one ask.

7. If the recipient moved roles or the account context changed, rewrite as a reconnect or current-role note.

## Message Rules

- Do not write a job-application style note unless the context is actually hiring.
- Do not stack several asks into one message.
- Do not lead with your full backstory.
- Do not sound like a mass outreach sequence.
- Do not use vague openers like `just checking in`.
- Do not use template words like `routing`, `tightening`, `lane`, or `quick update` unless they come from the source trail.
- Do not send a cosmetic rewrite of the previous note. If the next draft only paraphrases the last touch, stop until there is a real reply or a new source-backed angle.
- Do not send if the conflict check is unclear for a revenue, partnership, or customer pitch.

## Channel Guidance

- 1st-degree or active thread: reply in thread.
- 2nd/3rd-degree: note-style connect or short email.
- Inbound lead: acknowledge quickly and move toward a small next step.
- Warm partner or advisor: keep the ask light and specific.

## Output

Return:

- Draft text
- Recommended channel
- Source refs used
- Status (`research`, `draft`, `ready`, `blocked`)
- Suggested next follow-up date if relevant

## Style Defaults

- Short sentences.
- Concrete triggers.
- One ask.
- One proof point.
- Human, not hypey.
