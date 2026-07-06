# Daily Sourcing Routine — Last 24 Hours NYC ML Roles

**Time investment:** 5 minutes per day (best done 8am ET Monday–Friday)

---

## Step 1: Built In NYC (2 minutes)

1. Go to: https://www.builtinnyc.com/jobs/data-analytics/search/machine-learning-engineer
2. Look for **posting date indicators** (most sites show "posted today" or "posted yesterday")
3. **Filter manually** (if filters available):
   - Experience level: Senior, Staff, Lead
   - Salary visible: Yes
4. **Log any "posted today" roles** to tracker (see section below)

---

## Step 2: Wellfound NYC (2 minutes)

1. Go to: https://wellfound.com/role/l/machine-learning-engineer/new-york-city-ny
2. Wellfound **shows timestamps** (e.g., "posted 3 hours ago")
3. **Check for roles posted in last 24 hours**
4. Filter by:
   - Job type: Full-time
   - Experience: Senior+
   - Sort by: Newest first
5. **Log any "posted <24h ago" roles** to tracker

---

## Step 3: LinkedIn Jobs — NYC Filter (2 minutes)

1. Go to: https://www.linkedin.com/jobs/
2. **Search bar:** `machine learning engineer` OR `staff ml engineer` OR `senior ml engineer`
3. **Apply filters:**
   - Location: New York, NY (exact match)
   - Date posted: **Last 24 hours** (dropdown)
   - Experience level: Senior, Staff, Lead
   - Employment type: Full-time
4. **Sort by:** Most recent
5. **Log any visible roles** to tracker (get job title, company, link, comp if visible)

---

## Step 4: Direct Company Careers Pages (1 minute)

Check these NYC-based companies' careers pages (bookmark these):

**High-frequency posters** (check these first):
- Figma: https://www.figma.com/careers (search "machine learning" or "ML")
- Stripe: https://stripe.com/jobs (search "machine learning")
- Roblox: https://careers.roblox.com (search "machine learning")
- Databricks: https://databricks.com/careers (search "New York" + "machine learning")

**Finance/Quant:**
- Jane Street: https://www.janestreet.com/careers (search "machine learning" or "researcher")
- Two Sigma: https://careers.twosigma.com (search "machine learning")
- Citi: https://jobs.citi.com (search "machine learning" + filter NYC)
- State Street: https://careers.statestreet.com (search "machine learning")

**Other NYC presence:**
- Cohere Health: careers page (search "machine learning")
- OXMAN: careers page (search "machine learning")

**Log any fresh postings** to tracker.

---

## Tracker Template

**Save as:** `data/sourcing-daily-[YYYY-MM-DD].md`

```markdown
# Daily Sourcing Report — [Date]

## New Postings Found (Last 24 Hours)

| Company | Role | Posted | Location | Comp (Listed?) | Archetype | Source | Link | Action |
|---------|------|--------|----------|----------------|-----------|--------|------|--------|
| [Co] | [Role] | [Time] | [NYC/Hybrid/Remote] | [Salary if visible] | [Your archetype] | [Built In/Wellfound/LinkedIn/Direct] | [URL] | [Not applied / To evaluate / Applied] |
| | | | | | | | | |

## Summary

- **Total found today:** [N]
- **Target range ($180K-$250K):** [N]
- **Stretch tier ($250K+):** [N]
- **Lower tier (<$180K):** [N]
- **Research archetype:** [N]
- **Product ML archetype:** [N]
- **FDE archetype:** [N]

## High-Priority Roles (Score 4.0+ estimated)

1. [Company/Role] — Why high-priority
2. [Company/Role] — Why high-priority

## Follow-ups Needed

- [ ] Evaluate top 3 with /career-ops oferta
- [ ] Research contacts for top 3 with /career-ops outreach-campaign
- [ ] Add to pipeline.md if score >4.0
```

---

## Automation Option (Advanced)

If you want this **completely automated**, I can create a **scheduled Node.js script** that:

1. Runs daily at 8am EST
2. Scrapes LinkedIn Jobs API (with auth)
3. Scrapes Built In NYC + Wellfound
4. Filters for: NYC, last 24 hours, ML engineer roles
5. Outputs to `data/sourcing-daily-[date].md` automatically
6. Alerts you to high-signal roles

**This requires:**
- LinkedIn API credentials (or Playwright browser automation)
- Permission to run Node.js scripts daily on your machine
- A cron scheduler (already on most systems)

Would you like me to build this?

---

## Weekly Workflow

**Monday 8am:**
- Run daily checklist (5 min)
- Review new postings (10 min)
- Evaluate top 3 with `/career-ops oferta` (20 min)
- Research contacts with `/career-ops outreach-campaign` for top 3 (15 min)
- **Total: 50 minutes**

**Tuesday–Friday 8am:**
- Run daily checklist (5 min)
- Log new postings (5 min)
- Add to pipeline if score >4.0 (5 min)
- **Total: 15 minutes/day**

---

## Why This Works

✅ **Last 24 hours focus** — catches fresh postings before competition surges  
✅ **NYC-biased** — plays to your geographic advantage  
✅ **Repeatable** — same checklist every day, takes 5 minutes  
✅ **Feeds into pipeline** — integrates with `/career-ops pipeline` for bulk evaluation  
✅ **Scalable to automation** — can upgrade to daily script if desired  

---

## Getting Started

1. Bookmark these 4 URLs
2. Run the checklist tomorrow morning (Monday 8am)
3. Log findings to `data/sourcing-daily-[date].md`
4. Let me know if you want the automation script

---

## Automation Script (Node.js + Playwright)

If you say yes, I'll build:

```bash
# Run daily via cron
node sourcing-automation.mjs

# Output: data/sourcing-daily-[YYYY-MM-DD].md with today's postings
```

This would **eliminate the manual search** entirely — it runs automatically, pulls the data, and waits for you to evaluate.

**Want me to build it?**
