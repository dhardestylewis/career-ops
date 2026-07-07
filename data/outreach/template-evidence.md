# Outreach Template Evidence Pack

Date: 2026-07-05

This file is the evidence-backed template library for multi-lane LinkedIn and email outreach in this worktree.

## Evidence Base

- Live Gmail and LinkedIn outreach sample: short, specific, one-ask messages produced the most visible replies, meetings, and intros.
- Longer founder-style intros and broader cold outreach were more likely to remain pending.
- Live LinkedIn feed sampling: direct-contact and portal-style opportunity posts were easiest to action when the hook was concrete and the next step was obvious.
- External GTM guidance broadly agrees: personalized, concise messages with one clear CTA outperform generic or overlong outreach.
- The strongest messages usually have one decision point only: reply, redirect, or agree to a next step. Stacking several asks into one note makes the message weaker.
- Warm follow-ups do better when the opening line names the previous context explicitly, especially if the thread started on LinkedIn and moved to email.
- Warm academic, alumni, lab, and public-interest lanes follow the same pattern: one shared-context hook, one proof point, one small ask.
- Before sending, check the recipient's current LinkedIn profile or organization page. If they moved roles, rewrite the note as a reconnect or current-role note rather than an active-role follow-up.
- Before any outreach about work, money, gigs, contracts, or jobs, check the South Park Commons directory export first. If it gives a clean no-match and the contact is not SPC-adjacent, that is enough to proceed; use Slack or Pando only as tie-breakers when the result is ambiguous, OCR-noisy, or SPC-adjacent.

## Pre-Send Dossier

No template should be considered sendable until the contact dossier can answer these from actual sources:

1. Who the contact is and how they relate to the user.
2. The last real touch and its date.
3. Why the outreach is happening now.
4. The specific hook about the recipient.
5. The proof point that makes the ask credible.
6. The smallest sensible ask for the channel.
7. The risky, stale, or irrelevant material to avoid.
8. The send state and follow-up rule if there is no reply.
9. Whether South Park Commons affiliation has been checked when the pitch is work-related.

Minimum source set:

- Gmail thread history and exact subject lines.
- LinkedIn profile, post, and DM context.
- 1 to 2 public artifacts if the contact is academic, research, founder, or operator facing.
- One matching proof point from the user's CV, project notes, or repo.

If the source chain is incomplete, mark the row `research` or `blocked` instead of drafting a send.

## Core Rule

Use this skeleton unless the recipient type clearly demands otherwise:

1. Hook on them or their work.
2. One proof point about you.
3. One small ask.

## Canonical Guardrails

- Read `docs/outreach-guardrails.md` before drafting anything.
- Treat that file as the single source of truth for thread state, channel routing, send approval, and logging.
- If this template pack and the guardrails file disagree, the guardrails file wins.

## Channel Routing Rule

- Use a LinkedIn DM only for 1st-degree connections or existing threads.
- Use a note-style connection request for 2nd-degree and 3rd-degree contacts.
- Do not spend InMail by default on 2nd-degree or 3rd-degree contacts unless the user explicitly asks for it.
- If a profile only exposes a note path, keep the note short and let the follow-up happen after connection acceptance.

## Applied Evidence For World-Model Collaboration

Use this when the recipient is explicitly research-oriented or mentions a workshop or conference outcome.

- The current pitch docs already frame Homecastr as a forecast and scenario-analysis layer with live causal ML through sliders and chat.
- The latest run trail is durable: Modal launch manifests and transcripts are recorded in R2, so future conversations can cite concrete artifacts instead of ephemeral UI state.
- The world-model docs lean research-grade: typed latent world model, state-transition-first evaluation, and a queue worker that turns durable ingress into model work.
- The architecture notes already leave room for a publishable causal extension, including a Student Causal FM path with Granger-causality discovery.
- The research side already has publication-shaped evidence: 261 Tavus conversations, discovery-workshop framing, and an explicit note to publish research.

This combination supports a collaboration pitch that sounds like:

1. publishable world-model research
2. reproducible Modal / R2 / Supabase artifacts
3. one small ask: compare notes on experiment design or evaluation, especially diffusion or flow matching

## Template Library

### 300-char LinkedIn request

Use when sending a first-touch connection request.

Template:

`Loved your work on [specific thing]. Iâ€™m building [relevant project] and have solved [proof point]. Would be great to connect.`

Evidence:

- Short LinkedIn acknowledgments and scheduling notes got replies.
- The feed sample showed that concrete hooks and obvious next steps were easier to act on than vague outreach.
- Longer founder intros were weaker, so the request should stay compact.

### Recruiter DM

Use when the contact is clearly talent/recruiting and screening facts matter.

Template:

`Hi [Name] - I just applied for [role]. Iâ€™m a [current role / profile] with [1 proof point]. Happy to share more if useful.`

Evidence:

- Recruiter-style threads worked best when the message answered screening questions quickly.
- Application follow-ups with a direct role reference and one proof point were visible in the sample.
- The CTA worked best when it was a soft offer, not a multi-part ask.

### Hiring manager DM

Use when the person owns the team, product, or project.

Template:

`Hi [Name] - your work on [specific thing] stood out. Iâ€™ve built [relevant proof point] and would love to hear how your team is thinking about [problem].`

Evidence:

- In the sample, messages with a concrete reason for reaching out were strongest.
- Hiring-manager style notes performed better when they referenced the team problem instead of leading with a biography.
- The ask should be a conversation, not a pitch deck.

### Peer / referral DM

Use when the goal is relationship-building or a warm bridge, not a job ask.

Template:

`Hi [Name] - I liked your post on [specific thing]. Iâ€™m working on [adjacent thing] and would love to hear your take.`

Evidence:

- Referral / intro style threads worked best when the bridge was explicit and the ask was light.
- The weaker messages in the sample were the ones that tried to do too much at once.
- A genuine curiosity hook outperformed a self-centered opener.

### Interviewer DM

Use when you already have a scheduled conversation.

Template:

`Hi [Name] - looking forward to speaking on [date]. I appreciated your work on [specific thing] and have been digging into [relevant detail].`

Evidence:

- Post-meeting and interview follow-ups were among the most reliable positive-response patterns in the inbox sample.
- The key win factor was brevity plus a signal that you had done the homework.
- The CTA here is not a request; it is preparedness and rapport.

### First follow-up email

Use for the first follow-up after an application or intro.

Template:

`Subject: Re: [Role] at [Company]`

`Hi [Name], I applied for the [role] on [date]. I thought Iâ€™d share that [proof point] maps closely to the work described in the posting. If helpful, Iâ€™d be glad to share more or talk this week.`

Evidence:

- Post-application follow-ups with a specific role and date were common in the sample.
- Concrete proof points were enough; long background paragraphs were not necessary.
- A soft, time-bounded ask was easier to answer than a vague open loop.

### Founder-style intro

Use when the recipient likely cares about the bridge, not your full background.

Template:

`Saw your work on [specific thing]. Iâ€™m building [proof point], and [bridge context]. Open to a quick connect?`

Evidence:

- Founder-style intros were one of the weaker buckets in the sample when they started with too much context.
- They improved when the bridge was explicit and the bio was compressed.
- The message should sound like a bridge, not a pitch.
- Avoid phrases that pile on multiple actions, like "consider a quick intro call" plus "hear more about your current priorities" plus "see if there'"'"'s a way our work could be useful."
### Research collaborator note

Use when the recipient says the project is research-oriented and wants a workshop or conference outcome.

Template:

`Hi [Name] - that makes sense. Iâ€™ve been building a publishable world-model stack with reproducible Modal runs, durable R2 manifests/logs, and a research-grade evaluation loop. If it would be useful, Iâ€™d love to compare notes on experiment design and evaluation, especially around diffusion or flow matching.`

Evidence:

- Research-oriented recipients generally need a collaboration frame, not a job pitch.
- Reproducibility is the strongest bridge when the recipient is thinking about publication.
- The ask should be to compare notes, not to force a role conversation.
- The message works best when it names one concrete artifact class: run manifests, logs, or evals.
### Broader cold outreach

Use when there is no warm intro and the recipient has low time tolerance.

Template:

`Iâ€™m reaching out because [specific reason]. Iâ€™ve [proof point], and I think there may be a fit on [team/problem]. Worth a short chat?`

Evidence:

- Broader cold outreach was more likely to remain pending than short, concrete threads.
- The sample suggests a smaller ask is better than a bigger pitch.
- One sentence of value is enough; do not stack multiple asks.
- Name the recipient's specific post, project, or role in the first line. Generic "wanted to reach out" openers are too soft for cold outreach.

### Professor / former instructor reconnect

Template:

`Hi [Name] - I appreciated your work on [specific paper / talk / lab theme] and the chance to work with you on [class / project / research context]. I've been building [proof point], and I thought it could be worth reconnecting if you are open to it.`

Evidence:

- Warm academic threads benefit from a shared-context hook because the relationship already exists.
- When the professor has a public artifact, that is usually a stronger hook than generic gratitude.
- The strongest live messages in the sample were short, specific, and easy to answer.
- Inference: faculty and former instructors are more likely to respond when the first line names the shared project or class immediately.

### Alumni / career-services note

Template:

`Hi [Name] - I found your work through the [school] network. I've been building [proof point], and I would love to ask who the best person is to speak with about [area].`

Evidence:

- School-affiliated contacts work best as routers, not as pitch recipients.
- The smallest viable ask is usually "who should I talk to?" rather than "can you help me find a job?"
- Inference: alumni and career-services contacts respond better when the ask is for direction, not advocacy.

### Lab lead / researcher note

Template:

`Hi [Name] - your work on [specific topic] stood out. I'm building [proof point], and I thought there may be a useful overlap for a short connect.`

Evidence:

- The live sample showed that concrete hooks beat biography dumps.
- Research/lab contacts respond best when the message sounds like an informed peer note, not a mass email.
- Inference: one proof point plus one topical hook is enough for a lab lead.

### Nonprofit / public-sector note

Template:

`Hi [Name] - I saw your work on [mission / program]. I've been building [proof point], and I thought it could be worth a short connect if useful.`

Evidence:

- Mission-aligned outreach follows the same short-ask pattern as the best-performing messages in the sample.
- Public-interest contacts need a clean bridge to the mission, not a long personal history.
- Inference: the more constrained the time budget, the smaller the ask should be.

### Dormant warm tie nudge

Template:

`Hi [Name] - I wanted to revive our earlier thread on [context]. Since then, I've been working on [proof point], and I thought it could be worth reconnecting if you are open to it.`

Evidence:

- Warm follow-ups did better when the first line named the prior context explicitly.
- The sample suggests that restarting from scratch is weaker than re-anchoring the old thread.
- Inference: dormant warm ties need memory of the prior relationship more than they need a brand-new intro.

### Ecosystem connector / founder bridge

Template:

`Hi [Name] - I saw your work on [specific thing]. I've been building [proof point], and I thought there may be a useful bridge if you are open to a quick connect.`

Evidence:

- Founder-style intros were weaker when they led with too much context.
- They improved when the bridge was explicit and the ask stayed small.
- Inference: ecosystem connectors respond best to a bridge note, not a full founder bio.

## What To Keep Constant

- Personalize the first sentence, not the whole message.
- Keep the proof point to one crisp line.
- Use one CTA only.
- Prefer a conversational tone over formal corporate language.
- Do not use `just checking in`, `touching base`, or `circling back`.
- Do not send until the dossier has source refs, a last touch, a why-now, a hook, a proof point, and an ask.
- Do not send a work pitch until the South Park Commons directory export has been checked when relevant; a clean no-match is enough unless the contact is SPC-adjacent or the result is still ambiguous.

## What To Vary

- The hook changes per recipient.
- The proof point should match the recipient type.
- The ask should get smaller as the recipient becomes more senior or more time-constrained.
- Founder-style intros should open with the bridge.
- Peer/referral notes should open with curiosity, not a job ask.

## Handoff Rule For Another Agent

Before sending anything, the next agent should:

1. Check `modes/_profile.md`.
2. Check `modes/contacto.md`.
3. Check `modes/followup.md`.
4. Check `data/outreach/targets.tsv`.
5. Check `data/outreach/universe.tsv`.
6. Check `data/outreach/queue.tsv`.
7. Check `data/outreach/review.md`.
8. Draft first, then wait for send approval unless the user has already explicitly approved the recipient batch.
9. Log the send immediately if it goes out.
