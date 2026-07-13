# Modo: sourcing - Weekly Job Board Research Protocol

Goal: Systematically discover new data engineering, AI platform, and ML roles across job boards, verify posting dates, comp ranges, and feed high-signal opportunities into the pipeline.

---

## Search Queries by Archetype

Run these searches weekly (Monday mornings) on each platform below.

### Data Engineer / Data Platform

```
"Data Engineer" OR "Senior Data Engineer" remote SQL Spark
"Data Platform Engineer" OR "Analytics Engineer" remote
"Data Infrastructure Engineer" OR "Platform Data Engineer" remote
```

### AI Platform / MLOps

```
"AI Platform Engineer" OR "ML Platform Engineer" remote
"MLOps Engineer" OR "Machine Learning Infrastructure Engineer" remote
"AI Infrastructure Engineer" OR "Evaluation Engineer" remote
```

### ML Engineer / Applied AI

```
"Staff ML Engineer" OR "Senior ML Engineer" remote salary
"ML Engineer" infrastructure platform 2026
"MLOps Engineer" OR "ML Platform Engineer" remote
```

### AI/ML Research Engineer

```
"Research Engineer" ML OR AI 2026
"AI Research Engineer" OR "ML Research Engineer" remote
"Senior Research Engineer" machine learning
```

### Geospatial ML Engineer

```
"Geospatial" engineer OR scientist remote
"Geospatial ML" OR "GIS ML" OR "spatial data" engineer
"Remote sensing" machine learning engineer
```

### Forward Deployed ML Engineer

```
"Forward Deployed" engineer OR FDE remote
"Field Engineer" ML OR AI customer-facing
"Solutions Engineer" data OR AI startup
```

### AI/ML Consultant / Solutions Architect

```
"Solutions Architect" AI OR ML enterprise
"AI Consultant" OR "ML Consultant" remote
"Enterprise AI" engineer OR architect
```

### Data Scientist / Applied Scientist

```
"Data Scientist" ML OR "machine learning" remote
"Applied Scientist" OR "Applied AI" engineer remote
"Research Engineer" AI OR data remote
```

---

## Job Boards to Search (in priority order)

### Tier 1 NYC-FIRST (Last 24 Hours)

1. **Built In NYC** (best for recent NYC postings)
   - https://www.builtinnyc.com/jobs
   - Filter: Data Engineer, Data Platform, AI Platform, Senior/Staff level
   - Data: Shows posting date explicitly
   - Frequency: **Daily (Monday-Friday mornings)**

2. **Wellfound / AngelList** (NYC startups, Series B-D)
   - https://wellfound.com/jobs
   - Filter: Data Engineer, Data Platform, AI Platform, Location = NYC
   - Data: Shows posting timestamp (hours ago)
   - Frequency: **Daily**

3. **LinkedIn Jobs - NYC-Filtered** (largest pool)
   - Use LinkedIn's native job search:
     - Keywords: "Data Engineer" OR "Data Platform Engineer" OR "AI Platform Engineer" OR "Staff ML Engineer"
     - Location: New York, NY (toggle "exact location")
     - Date posted: **Last 24 hours** (use dropdown)
     - Experience level: Senior, Staff, Lead
   - Frequency: **Daily (2x: 8am & 4pm ET)**

### Tier 2 (Company-Specific - NYC Offices)

4. **NYC-Based Company Career Pages** (direct hiring)
   - **Finance/Trading (highest pay):**
     - Jane Street: https://www.janestreet.com/careers
     - Two Sigma: https://careers.twosigma.com
     - Citadel: https://www.citadel.com/careers
     - Point72: https://careers.point72.com
   - **Tech (growth-stage):**
     - Databricks (NYC office): https://databricks.com/careers
     - Figma (NYC office): https://www.figma.com/careers
     - Snowflake: https://www.snowflake.com/careers
     - CoreWeave: https://www.coreweave.com/careers
     - Roblox (NYC office): https://careers.roblox.com
   - **Enterprise/Strategic:**
     - Citi AI: https://jobs.citi.com (search "Data Engineer" or "Data Platform")
     - Goldman Sachs Marquee: https://www.goldmansachs.com/careers (search "data engineering" or "platform")
   - Frequency: **Weekly (Monday mornings)**

5. **Greenhouse Aggregator** (NYC focus)
   - Search: `site:greenhouse.io "new york" OR "NYC" "data engineer" OR "ml engineer"`
   - Example: `site:greenhouse.io databricks "new york"`
   - Frequency: **2x per week (Mon/Thu)**

### Tier 2 (Good supplementary sources)

4. **Built In** (tech-focused, curated)
   - `builtin.com/jobs/remote` + filter by job title and salary visible
   - Frequency: Weekly

5. **AngelList** (early-stage startups)
   - `angellist.com/jobs` + filter remote, ML/AI roles
   - Frequency: Weekly

6. **Blind Job Search** (tech community sourced)
   - `blind.com/jobs` + use company/role filters
   - Frequency: Bi-weekly

---

## Non-Traditional Discovery Lanes

Use these to widen the funnel without falling back to generic mass boards:

1. **YC Work at a Startup**
   - Best when you want startup roles with a single profile and direct founder visibility.
   - Strong for engineering, product, design, recruiting, and science roles.

2. **Jack & Jill**
   - Best when you want AI-assisted discovery that can introduce you directly to hiring managers.
   - Treat it as a discovery layer, not the source of truth for the application.

3. **Built In**
   - Best when you want real-time jobs plus company context and salary visibility.
   - Useful for roles where company research matters as much as the posting itself.

4. **Hacker News "Who is Hiring?"**
   - Best when you want startup posts with direct email instructions, explicit comp, or founder-led hiring.
   - Strong fallback when you want to avoid generic mass boards.

5. **Direct email / LinkedIn DM**
   - Best when you already have a named recruiter, hiring manager, founder, or team lead.
   - Keep the ask candidate-seeking only: role, interview path, or next step.

### Tier 3 (For gaps)

7. **ZipRecruiter, Indeed** (high volume, lower signal)
   - Only use if searching for lower-comp opportunities ($150K-$180K range)
   - Frequency: Monthly

---

## Evaluation Criteria for Each Posting

When you find a role, ask:

**Archetype Fit:**
- [ ] Does it map to one of Daniel's target archetypes?
- [ ] Is the tech stack relevant? (Python, SQL, Spark, PySpark, dbt, etc.)

**Timing:**
- [ ] Posted in last 30 days? (Check posting date)
- [ ] Still actively hiring? (Check for "actively hiring" badge, or company news)

**Comp:**
- [ ] Salary listed? Note min/max
- [ ] If not listed, estimate from Levels.fyi / Blind / KORE1

**Remote:**
- [ ] Full remote? (Score 5.0)
- [ ] Hybrid NYC? (Score 4.5)
- [ ] Other? (Lower score)

**Stage:**
- [ ] Early-stage startup? Growth? Public? (Affects culture, speed, comp)

**Company Credibility:**
- [ ] Known company? Funded? Public? (Affects legitimacy)
- [ ] YC pedigree? a16z-backed? Founder track record?

---

## Data Entry: Adding to Pipeline

For each role that passes evaluation:

1. **Record in `data/tracker/pipeline.md`:**
   ```markdown
   | [Company] | [Role Title] | [JD URL] | [Posted: YYYY-MM-DD] | [Estimated Comp] | [Notes] |
   ```

2. **Save JD locally** (optional but recommended):
   ```
   cp JD.html data/pipeline/[company-role-date].html
   ```

3. **Trigger pipeline processing** (run weekly):
   ```bash
   /career-ops pipeline
   ```
   This evaluates all URLs in bulk.

---

## Market Reference (2026)

For comp estimation if not listed:

**Entry to Mid-Senior ($150K-$180K):**
- Early-stage startups (pre-Series A)
- Bootstrap companies
- Lower-cost-of-living markets (despite remote)
- "Data Scientist" title at smaller firms

**Core Target ($180K-$220K):**
- Series B-D startups (Databricks, Scale, Cursor)
- Growth-stage scale-ups
- Staff ML Engineer at mid-market tech

**Stretch ($220K-$280K+):**
- Series D+ startups (Anthropic, Mistral)
- Public company premium (Google, Meta, Microsoft)
- Research/Research Engineer roles

**Top Tier ($280K-$500K+):**
- Frontier labs (OpenAI, DeepSeek, Anthropic research)
- Quantitative trading (Jane Street, Two Sigma)
- Usually requires specialized hiring path (research background, publication history)

---

## Sample Weekly Workflow

**Monday Morning (30 min):**
1. Search LinkedIn with "last 7 days" filter
2. Check Anthropic, Mistral, Cursor career pages for new postings
3. Search `site:greenhouse.io` for top 5 companies
4. Add any new roles to `data/tracker/pipeline.md`

**Thursday Morning (15 min):**
1. Re-run LinkedIn search (catches Thursday postings)
2. Add new roles to pipeline

**Friday Afternoon (30 min):**
1. Run `/career-ops pipeline` to bulk-evaluate all pending URLs
2. Review evaluations, add high-signal roles to tracker
3. Identify contacts to research for top 3 roles

---

## Red Flags (Skip These)

- Posted > 90 days ago (stale)
- "We regret to inform you" language in JD (role closed)
- Comp significantly below walk-away ($150K) without strong rationale
- "Looking for PhD" as hard requirement (unless you have one)
- On-site only, no remote/hybrid option (unless NYC)
- Requires relocation with no signing bonus mentioned
- Company in late-stage layoffs (hiring freeze likely coming)

---

## Success Metrics (Track Over Time)

- **Sourcing**: [new roles found] per week
- **Quality**: % of sourced roles that score 4.0+
- **Velocity**: Days from discovery -> application (goal: < 7 days)
- **Conversion**: % of applications -> interviews -> offers
- **Network effect**: % of roles found via referral (grows over time)

---

## Tools to Have Open

- Levels.fyi for comp benchmarks: https://levels.fyi
- KORE1 salary guides: https://www.kore1.com/salary-guide/
- Blind for salary discussions: https://www.blind.com/posts
- Company Crunchbase profiles: https://www.crunchbase.com
