# Modo: outreach-campaign â€” Systematic Multi-Touch Verified Contact Outreach

When given a company + role, systematically identify verified contacts using SPC tools (Gem/Nyne) and generate personalized outreach sequences.

---

## Quick Start Workflow (15 min per company)

**For each Tier 1 target (Anthropic, Capital One, BlackRock, Citi, T. Rowe Price):**

```
1. Use Gem (15 min):
   - Log in to Gem
   - Search: [Company name] + "[Role type]" (e.g., "Engineering Manager")
   - Export results to CSV
   - Get: 5-10 names, titles, verified emails, phone numbers

2. Organize contacts (5 min):
   - Sort by role into tiers (Hiring Manager, Recruiter, Team IC, Skip-level)
   - Copy template from Step 2 below
   - Fill in details from Gem export

3. Generate messages (10 min):
   - Use templates from Step 3 + Step 4 below
   - Personalize with company/product research
   - Save draft in contact list

4. Execute outreach (5 min/day):
   - Day 1: Hiring Manager
   - Day 2-3: Team IC + Skip-level
   - Day 7: Recruiter
   - Day 14: Follow-up

**Total time: ~2-3 hours for 5 companies = 20-30 verified contacts ready to reach**
```

---

## Input Format

```
Company: [company name]
Role: [job title or URL]
Status: [Evaluated/Applied/In Progress]
Contact Source: [Gem / Nyne / Dover]
```

## Step 0 â€” Contact Tiers & Identification Strategy

Tier 1 (Direct hiring power):
- **Hiring Manager** â€” typically "Manager, [team]" or "Engineering Manager, [domain]"
  - Role: Direct decision-maker on hire
  - Why: Direct yes/no authority. Coldest outreach, highest conversion if personalized.

- **Recruiting Lead** â€” typically "Technical Recruiter" or "Talent Acquisition Manager"
  - Role: Manages candidate flow, advocates internally
  - Why: Professional gatekeeper. More likely to respond, can champion your profile.

Tier 2 (Credibility & team fit):
- **Team IC / Senior Individual Contributor** â€” peer-level engineer on the team
  - Role: Will work with you day-to-day
  - Why: Technical validation, referral power, internal feedback loop.

- **Team Lead / Skip-level** â€” one level above the hiring manager
  - Role: Strategic sponsor, team structure insight
  - Why: Can pull you in informally, advocates at higher level.

Tier 3 (Strategic):
- **Department VP / Head** â€” Director or VP level
  - Role: Org-level relationships
  - Why: Use only for strategic vision alignment or warm intro access.

## Step 1 â€” Contact Discovery (Using SPC Tools)

### Option A: Gem (Recommended â€” Fastest)

**What it is:** AI recruiting platform with 650M+ profiles, sourcing tools, verified contact data
**SPC Deal:** Built-in (standard SPC access)
**Time per company:** 15 minutes

**Steps:**

```
1. Log in to Gem (gem.com or SPC dashboard)
2. Create search query:
   Company: [Company name]
   Keywords: [Role type] (e.g., "Engineering Manager", "Senior Engineer", "Recruiter")
   Location: [Optional â€” NYC, etc.]

3. Example queries:
   - Anthropic + "Engineering Manager"
   - Capital One + "AI Engineer"
   - BlackRock + "VP Platform"
   - Citi + "Director Applied AI"
   - T. Rowe Price + "Senior Engineer"

4. Results show:
   âœ… Name
   âœ… Current title
   âœ… Email address (verified)
   âœ… Phone (sometimes)
   âœ… Work history
   âœ… Location/team

5. Export to CSV/download contact list

6. Sort by tier:
   - Tier 1: Hiring Manager, Recruiter
   - Tier 2: Senior IC, Team Lead
   - Tier 3: VP, Director
```

**Output:** 5-10 verified contacts with emails per company in 15 min

---

### Option B: Nyne (Backup/Supplementary)

**What it is:** People search + enrichment API
**SPC Deal:** 30% off
**Time per company:** 10-15 minutes

**Steps:**

```
1. Go to nyne.com
2. Search by company + role keywords
3. Get results with:
   âœ… Name
   âœ… Current title
   âœ… Email
   âœ… Phone
   âœ… Work history

4. Use if Gem doesn't have complete coverage
```

---

### Option C: Dover Recruiter Intros (Strategic)

**What it is:** Marketplace of vetted independent recruiters
**SPC Deal:** Free intro calls with 3 recruiters
**Time:** 30 min call + async follow-up

**Steps:**

```
1. Book Dover intro call with a recruiter
2. Ask: "For [Company] Engineering Manager roles, who should I reach out to?
   Can you share names, titles, and internal structure?"
3. They provide:
   âœ… Specific names + titles
   âœ… Org chart context
   âœ… Warm intro offers
   âœ… Hiring patterns/timing
4. They may make warm intros directly
```

**Best for:** Verification + warm intros + strategic context

## Step 2 â€” Contact List Template (Gem/Nyne Output)

After sourcing with Gem or Nyne, organize into `data/outreach/{company-slug}-{role-slug}-contacts.md`:

```markdown
# Outreach Campaign: [Company] â€” [Role]

**Status:** [Sourcing / In Progress / Applied / Offer Received]
**Job URL:** [JD link]
**Contact Source:** [Gem / Nyne / Dover]
**Source Date:** [YYYY-MM-DD]
**Target Archetypes:** [which archetype(s) match]
**Comp Alignment:** [$range]

## Tier 1 â€” Direct Hiring Power

### Hiring Manager
- **Name:** [from Gem/Nyne export]
- **Title:** [from source]
- **Email:** [verified from Gem/Nyne] âœ…
- **Phone:** [if available]
- **Key detail:** [from work history or title context]
- **Status:** [Not contacted / Message drafted / Sent / Replied]
- **Outreach date:** [YYYY-MM-DD]
- **Notes:** [personalization angle]

### Recruiting Lead / Technical Recruiter
- **Name:** [from Gem/Nyne export]
- **Title:** [Recruiter, Technical Recruiter, TA Manager]
- **Email:** [verified from Gem/Nyne] âœ…
- **Phone:** [if available]
- **Key detail:** [team they cover]
- **Status:** [Not contacted / Message drafted / Sent / Replied]
- **Outreach date:** [YYYY-MM-DD]
- **Notes:** [first point of contact typically]

## Tier 2 â€” Credibility & Team Fit

### Team IC / Senior Individual Contributor
- **Name:** [from Gem/Nyne export]
- **Title:** [Senior Engineer, Staff Engineer, Principal]
- **Email:** [verified from Gem/Nyne] âœ…
- **Phone:** [if available]
- **Key detail:** [tech stack, recent projects from work history]
- **Status:** [Not contacted / Message drafted / Sent / Replied]
- **Outreach date:** [YYYY-MM-DD]
- **Notes:** [peer credibility play angle]

### Team Lead / Skip-Level Manager
- **Name:** [from Gem/Nyne export]
- **Title:** [Engineering Manager, Director, VP]
- **Email:** [verified from Gem/Nyne] âœ…
- **Phone:** [if available]
- **Key detail:** [team size, reporting line, leadership scope]
- **Status:** [Not contacted / Message drafted / Sent / Replied]
- **Outreach date:** [YYYY-MM-DD]
- **Notes:** [strategic sponsor angle]

## Tier 3 â€” Strategic (Optional)

### Department VP / Head
- **Name:** [from Gem/Nyne if available]
- **Title:** [VP, SVP, C-level]
- **Email:** [verified from Gem/Nyne] âœ…
- **Phone:** [if available]
- **Key detail:** [org they lead, strategic direction]
- **Status:** [Reserved for warm intro / Not contacted]
- **Outreach date:** [YYYY-MM-DD if used]
- **Notes:** [only contact via warm intro]

## Outreach Sequencing & Drafts

### Day 1 â€” Hiring Manager (Direct Ask)
**Goal:** Get on calendar
**Timing:** Tuesday-Thursday, 10am-2pm PT

[DRAFT MESSAGE]

### Day 2-3 â€” Team IC / Senior IC (Credibility Play)
**Goal:** Validate technical fit + request referral
**Timing:** Stagger across 2 days

[DRAFT MESSAGE]

### Day 4-5 â€” Skip-Level (Strategic Intro)
**Goal:** Warm up the relationship, demonstrate vision alignment
**Timing:** Stagger across 2 days

[DRAFT MESSAGE]

### Day 7 â€” Recruiter (Coordinated Handoff)
**Goal:** Synchronize with formal process
**Timing:** Monday, 9am-10am PT

[DRAFT MESSAGE]

### Day 14 â€” Follow-up (Gentle Nudge)
**Goal:** Reactivate without being pushy
**Timing:** Mid-week

[DRAFT MESSAGE]

## Campaign Tracking

| Contact | Tier | Sent | Status | Last Reply | Next Action | Notes |
|---------|------|------|--------|------------|-------------|-------|
| [Name] | 1 | YYYY-MM-DD | Replied | YYYY-MM-DD | [action] | [context] |
```

## Step 3 â€” Message Templates by Contact Type

### Template A: Hiring Manager (Cold)

```
Subject: [Team] at [Company] â€” [Your Specific Skill] + [Company Product Interest]

Hi [Name],

I came across [Company]'s [specific product/initiative] and [one-sentence specific observation]. I've spent the last [timeframe] building [one proof point â€” e.g., "forecasting systems that outperform public company benchmarks"] and think there's a real fit here.

[one specific thing you noticed about their team/direction]

Would you have 15 minutes this week to explore fit?

[Your name]
[Your LinkedIn]
```

Key principles:
- No "Hi, I'm interested in your role" â€” too generic
- ONE specific thing about company/product (not generic "excited about AI")
- ONE proof point that maps to their needs
- Short. Respectful of their time.

### Template B: Team IC / Senior IC (Peer Ask)

```
Subject: [Company] [Team] â€” your work on [specific project/tech]

Hi [Name],

Your [recent post/project] on [specific thing] caught my eye â€” I've done similar work with [brief proof point].

I'm exploring joining [Company] as a [role] and think I'd be a strong fit on [Team]. Do you have 20 minutes to talk about the culture, tech stack, and whether you'd consider putting in a referral?

[Your name]
[Your LinkedIn]
```

Key principles:
- Lead with *their* work, not your interests
- Show you've read their profile / followed their work
- Ask for both: conversation + referral

### Template C: Skip-Level / Team Lead (Strategic)

```
Subject: [Company]'s direction in [domain] â€” quick chat?

Hi [Name],

I've been following [Company]'s work on [strategic initiative]. My background in [one relevant area] and current work on [proof point] align closely with where [Team] seems to be heading.

I'm exploring a [Role] on [Team] and would value 20 minutes of your time to understand the vision and see if there's a fit.

[Your name]
[Your LinkedIn]
```

Key principles:
- Frame as strategic alignment, not a job ask
- Acknowledge their leadership role
- Show you understand the team's direction

### Template D: Recruiter (Coordinated)

```
Subject: [Role] application â€” [Your Name] â€” referred by [Hiring Manager]

Hi [Recruiter Name],

I applied for the [Role] position and have also connected with [Hiring Manager Name] on LinkedIn. Given [specific reason for fit], I wanted to make sure my application reached you with full context.

Quick background: [one sentence]. Key fit: [one proof point mapped to JD].

Looking forward to moving forward.

[Your name]
[Your LinkedIn]
```

Key principles:
- Mention the hiring manager (social proof)
- Keep it brief â€” they have your formal app
- Focus on "coordinating" not "pushing"

## Step 4 â€” Campaign Status in Tracker

After identifying contacts, update `data/tracker/applications.md` with new column:

```
| # | Date | Company | Role | Score | Status | PDF | Report | Outreach | Notes |
|---|------|---------|------|-------|--------|-----|--------|----------|-------|
| N | DATE | Co | Role | X.X/5 | Applied | âœ… | [link] | ðŸ”— [Company-Role-Contacts](data/outreach/...) | [summary] |
```

## Step 5 â€” Auto-Generate Message Drafts

For each contact, generate personalized drafts using:
1. Key detail from their profile (post, role, team affiliation)
2. Matching proof point from Daniel's CV
3. Template structure above
4. Specific company/product detail

Replace placeholders with real names, titles, and specifics.

---

## When to Use This Mode

- **After scoring a role 4.0+:** Identify contacts before OR alongside formal application
- **For Tier 1 companies (Google X, Baseten, etc.):** Always run contact discovery
- **For cold apply:** Contact discovery + outreach is your diff; use it
- **For follow-up:** If application stalled, reach out to skip-level or IC

## When NOT to Use

- **Sub-4.0 scores:** Don't bother with outreach â€” your time is better spent elsewhere
- **Already connected / existing organization relationship:** Treat as protected. Draft the exact note, show recipient + organization + candidate-seeking lane + channel + final copy in the current chat, and wait for explicit approval before any send. Skip generic outreach, but do not infer permission to message directly.
- **Companies with hiring freezes:** Check company news before investing time

---

## Integration with Daily Sourcing Workflow

**This mode complements `/career-ops sourcing`:**

```
Daily Sourcing (8am ET) â†’ /career-ops sourcing
  â†“
Outputs: data/sourcing-daily-[date].md (5-15 new roles/day)
  â†“
For top 3 roles (score 4.0+):
  â†“
Use /career-ops outreach-campaign + Gem
  â†“
Outputs: data/outreach/[company]-contacts.md (5-10 verified contacts + drafts)
  â†“
Execute sequenced outreach (5 min/day)
```

**Weekly rhythm:**
- **Mon 8am:** Sourcing runs â†’ identify top roles
- **Mon 10am:** Source contacts with Gem (3 companies, 45 min)
- **Tue-Fri:** Execute outreach sequencing (5 min/day)
- **Next Mon:** Follow-up + new sourcing cycle

---

## Success Metrics

Track over time:
- **Contact sourcing efficiency:** Avg time to get 5-10 verified contacts per company
- **Email accuracy:** % of non-bouncing emails from Gem
- **Response rate by tier:** Which tiers respond most?
- **Conversion funnel:** Messaged â†’ Reply â†’ Coffee chat â†’ Interview â†’ Offer
- **Time to response:** Average days by contact type
- **Best templates:** Which message structures get replies?
- **Outreach-to-application ratio:** % of sourced contacts who end up applying

Adapt templates and company targeting based on what works.

---

## SPC Tools Quick Reference

| Tool | Purpose | Time | Cost | SPC Deal |
|------|---------|------|------|----------|
| **Gem** | Fast verified contact sourcing | 15 min/company | Low | Included |
| **Nyne** | People search + enrichment (backup) | 10 min/company | Low | 30% off |
| **Dover** | Recruiter marketplace + warm intros | 30 min call | Medium | 3 free intro calls |

**Best workflow:** Gem first (15 min) â†’ Nyne if gaps (10 min) â†’ Dover for warm intros (optional)
