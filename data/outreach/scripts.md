# Ready-To-Send Outreach Scripts

Date: 2026-07-05

Use these as the default first draft, then swap in the recipient-specific details.

## 1) Warm Intro Email

**Use when:** there is a referral, intro, or prior thread that already created some trust.

**Subject:** `Re: [Role / intro context]`

```text
Hi [Name],

Thanks for the intro / the note / the LinkedIn discussion. I saw the context on [specific thing], and it maps well to the work I've been doing on [proof point].

If helpful, I'd be glad to share a bit more or set up a quick chat this week.

Best,
[Your Name]
```

**Why this works**
- Names the prior context immediately.
- Gives one proof point.
- Asks for one next step only.

## 2) Cold LinkedIn DM

**Use when:** there is no warm intro and you need a low-friction cold touch.

```text
Hi [Name] - I saw your post on [specific thing]. I'm building [proof point] and I think there may be a fit on [team/problem]. Worth a short chat?
```

**Why this works**
- Opens with the specific post or role.
- Compresses the proof point to one line.
- Ends with one narrow ask.

## 3) Founder-Style Bridge Note

**Use when:** the recipient is a founder, operator, or someone who values context but does not need your full bio.

```text
Hi [Name] - I saw your work on [specific thing]. [Bridge context]. I've been working on [proof point], so I thought it could be worth a quick connect if useful.
```

**Why this works**
- Leads with the bridge, not the biography.
- Avoids stacking multiple asks.
- Keeps the tone collegial instead of pitchy.

## 4) Tailored Script: Apple - Machine Learning Engineer, Video Engineering

**Use when:** the target is a specific role like `Machine Learning Engineer, Video Engineering` and you want a version tuned to production ML reliability plus the job posting itself.

**Warm intro email**

```text
Hi [Name],

Thanks for the intro / note. The Machine Learning Engineer, Video Engineering role stood out because it combines production ML with reliability and evaluation work, which is exactly the kind of system work I've been doing.

If useful, I'd be glad to share a little more context or chat briefly this week.

Best,
[Your Name]
```

**Cold LinkedIn DM**

```text
Hi [Name] - I saw the Machine Learning Engineer, Video Engineering opening. I've been building production ML systems with a reliability/evaluation focus, and I thought it could be worth connecting if the team is open to it.
```

**Founder-style bridge note**

```text
Hi [Name] - I saw your work on video engineering at Apple. I've been building production ML systems for geospatial forecasting and reliability work, so I thought there might be a useful overlap for a quick connect.
```

## 5) Lane-Specific Variants

### Professor / Former Instructor Reconnect

**Use when:** the recipient is a professor, advisor, or former instructor.

**Email**

```text
Hi [Name],

I appreciated your work on [specific paper / talk / lab theme] and the chance to work with you on [class / project / research context]. I have been building [proof point], and I thought it could be worth reconnecting if you are open to a quick conversation.

Best,
[Your Name]
```

**LinkedIn DM**

```text
Hi [Name] - I appreciated your work on [specific paper / talk / lab theme]. I've been building [proof point], and I thought it could be worth reconnecting if a short chat is useful.
```

### Alumni / Career Services Note

**Use when:** the recipient is an alumni-office contact, career-services staffer, or school-affiliated connector.

**Email**

```text
Hi [Name],

I am reaching out through the [school] network because I am looking to connect with people working on [area]. I have been building [proof point], and I would appreciate any guidance on the best person or path to speak with.

Best,
[Your Name]
```

**LinkedIn DM**

```text
Hi [Name] - I found your work through the [school] network. I've been building [proof point], and I would love to ask who the best person is to speak with about [area].
```

### Lab Lead / Researcher Note

**Use when:** the recipient leads a lab, program, or research group.

**Email**

```text
Hi [Name],

Your work on [specific project / paper / lab theme] stood out. I have been working on [proof point], and I thought there may be a useful overlap for a short conversation or a pointer to the right person.

Best,
[Your Name]
```

**LinkedIn DM**

```text
Hi [Name] - your work on [specific topic] stood out. I'm building [proof point], and I thought there may be a useful overlap for a short connect.
```

### Nonprofit / Public-Sector Note

**Use when:** the recipient works in a nonprofit, civic-tech, or public-sector role.

**Email**

```text
Hi [Name],

I came across your work on [mission / program]. I have been building [proof point], and I thought it could be useful to connect if your team is open to a short chat.

Best,
[Your Name]
```

**LinkedIn DM**

```text
Hi [Name] - I saw your work on [mission / program]. I've been building [proof point], and I thought it could be worth a short connect if useful.
```

### Dormant Warm Tie Nudge

**Use when:** you already know the person but the thread has gone quiet.

**Email**

```text
Hi [Name],

I wanted to revive our earlier thread on [context]. Since then, I have been working on [proof point], and I thought it could be worth reconnecting if you are open to it.

Best,
[Your Name]
```

**LinkedIn DM**

```text
Hi [Name] - circling back on our earlier thread is probably too much, so I'll just say I still think the overlap on [context] is real. I've been building [proof point], and I'm happy to reconnect if useful.
```

### Ecosystem Connector / Founder Bridge

**Use when:** the recipient is a founder, operator, community lead, or startup-network connector.

**Email**

```text
Hi [Name],

I saw your work on [specific thing]. I have been building [proof point], and I thought there may be a useful bridge if you are open to a quick connect.

Best,
[Your Name]
```

**LinkedIn DM**

```text
Hi [Name] - I saw your work on [specific thing]. I've been building [proof point], and I thought it could be worth a quick connect if helpful.
```

## Fill Rules

- Replace only the bracketed text.
- If you need a second proof point, you probably need to shorten the script instead.
- If the message gets longer than this, convert it to an email and keep the LinkedIn version short.
- If the contact dossier is incomplete, do not send yet. Mark the row `research` and gather the missing source material first.
- For professors and former instructors, use a public artifact when one exists. A paper, lecture, talk, lab page, or editorship is usually a better hook than generic thanks.

## Required Pre-Send Dossier

Before any send, write down:

1. Contact and relationship
2. Last real touch and date
3. Why now
4. Specific hook about them
5. Proof point about you
6. Smallest sensible ask
7. What to avoid
8. Send state and follow-up rule
9. South Park Commons directory export check if the outreach is about work, money, gigs, contracts, or jobs; record whether it was a clean no-match or whether Slack/Pando was needed as a tie-breaker

Then stage the final outbound copy in `data/outreach/*send-packet.md` and run:

```bash
node src/dataOps/outreach-preflight.mjs --packet <send-packet-path>
```

If preflight fails, do not send.

Minimum source inputs:

- Gmail thread or LinkedIn DM history
- LinkedIn profile and recent activity
- 1 to 2 public artifacts if the person is academic, research, founder, or operator facing
- One matching proof point from the user's CV or repo
- Verify the person's current LinkedIn profile or organization page before sending. If the person moved, rewrite the note as a reconnect or current-role note, not an active-role follow-up.

## Quick Adjustments

- Recruiter: move role fit / availability into the first sentence.
- Hiring manager: swap `[team/problem]` for a concrete team challenge.
- Peer/referral: change the ask to curiosity, not a job request.
- Interviewer: swap the ask for a simple "looking forward to speaking."

## Follow-Up Variants

### Variant A: First follow-up

```text
Hi [Name] - just following up on my note about [role / topic]. I'm still excited about the fit because [one proof point], and I'd be glad to share anything else that would be helpful.
```

### Variant B: Second follow-up

```text
Hi [Name] - one quick update from my side: [new proof point / insight]. If it's helpful, happy to reconnect or point you to the right person.
```

### Variant C: Warm-thread nudge

```text
Hi [Name] - thanks again for the intro / earlier discussion. Just checking whether there's a preferred next step on your side, and I'm happy to follow it.
```

## Send / No-Send Checklist

### Send

- There is a named person or direct contact path.
- The contact dossier is complete and source-backed.
- The exact outbound text has passed `node src/dataOps/outreach-preflight.mjs --packet <send-packet-path>`.
- The current LinkedIn role or org page has been checked when the recipient could have moved.
- The South Park Commons directory export has been checked for any work, money, gigs, contracts, or jobs pitch, and a clean no-match is recorded unless the contact is SPC-adjacent or the result is still ambiguous.
- You can write the message with one hook, one proof point, and one ask.
- The role, project, or post is clearly relevant.
- The thread is not blocked by CAPTCHA or login friction.
- You are not stacking several asks into one note.

### No-Send

- The contact path is blocked or ambiguous.
- You need more than one proof point to explain the fit.
- The message would become a pitch deck.
- There is no obvious role or context to reference.
- The note relies on vague phrases like "just checking in" or "wanted to reach out."
- The dossier has missing source refs, missing last touch, or a missing why-now.
- The recipient's current role has changed and the note has not been rewritten as a reconnect/current-role note.
- The South Park Commons affiliation is unclear for a work-related pitch.
- The preflight reports a wrong greeting, another recipient's name, a missing dossier field, or a follow-up that is too soon.

## Response Handling

Use this after a message goes out:

- If they reply with a clear yes/no or simple scheduling question, answer directly and keep it short.
- If they reply with a question that changes the strategy, pause and notify the user for human judgment.
- If there is no reply, follow the standard follow-up cadence:
  - First follow-up: 5 business days after the send by default, and never sooner than 3 business days.
  - Second follow-up: 5 business days after the first follow-up by default, and never sooner than 3 business days.
  - After that, stop unless the user explicitly wants another pass.
- If the thread is warm or already in motion, use the warm-thread nudge variant instead of a cold restart.
- If LinkedIn or email blocks the send path, do not improvise around CAPTCHA or access friction; mark the route blocked and try a different contact path.
