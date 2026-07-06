# Contact Research Template â€” Finding Hiring Managers & Recruiters

**For each company in your Tier 1 targets, use this process to find 4-6 key contacts.**

---

## Process Overview

| Step | Time | Tools | Output |
|------|------|-------|--------|
| 1 | 5 min | LinkedIn | Find 4 people: hiring manager, team lead, IC, recruiter |
| 2 | 3 min | Company site + email finder | Extract email patterns, LinkedIn URLs |
| 3 | 2 min | Hunter.io or RocketReach (free tier) | Verify/find emails |
| 4 | - | Record in tracker | Add to outreach campaign |

---

## Detailed Steps

### Step 1: LinkedIn Search (5 minutes per company)

**Go to LinkedIn â†’ Search bar**

```
[Company Name] [Role Keywords]
```

**Examples for your Tier 1 targets:**

#### Anthropic
```
Search: "Anthropic" "Engineering Manager" "Enterprise"
Results: Find the team leads managing enterprise projects
```
Look for:
- Engineering Manager (hiring manager)
- Senior Engineer on the same team
- Recruiting Coordinator or Technical Recruiter
- Director or VP overseeing the team

#### Capital One
```
Search: "Capital One" "AI Engineer" "Vision" OR "MLX" "New York"
Results: Find the VML (Vision ML) team members
```
Look for:
- Lead AI Engineer or Principal (direct hire)
- Senior Engineer on the team
- Recruiting Manager for AI/ML
- Engineering Director overseeing AI teams

#### BlackRock
```
Search: "BlackRock" "VP AI Platform" OR "AI Platform Engineering"
Results: Find the team
```
Look for:
- VP or Director of AI Platform (hiring manager)
- Senior Engineer on platform team
- Recruiter for Platform Engineering
- Head of Engineering for the org

#### Citi
```
Search: "Citi" "Director Applied AI" OR "AI Engineering" "New York"
Results: Find the team
```
Look for:
- Director of Applied AI Engineering (hiring manager)
- Senior/Principal Engineer
- Talent Acquisition for AI/ML
- VP overseeing AI engineering

#### T. Rowe Price
```
Search: "T. Rowe Price" "AI Software Engineer" OR "AI Engineering" "New York"
Results: Find the team
```
Look for:
- Engineering Manager or Director for AI
- Senior/Principal Engineer
- Technical Recruiter for Engineering
- Head of Technology (strategic intro)

---

## For Each Person Found

**Record in your tracker:**

| LinkedIn URL | Name | Title | Company | Email | Phone | Notes |
|--------------|------|-------|---------|-------|-------|-------|
| linkedin.com/in/... | [Name] | [Title] | [Co] | [verify below] | [LinkedIn message if public] | [relevant projects/posts] |

---

## Step 2: Find Email Addresses

### Free/Freemium Tools (in priority order):

1. **Hunter.io** (free tier: 50/month)
   - Go to: hunter.io
   - Enter company domain (e.g., `anthropic.com`)
   - Search for person name
   - Shows most likely email pattern
   - Format: usually `firstname@company.com` or `f.lastname@company.com`

2. **RocketReach** (free tier: limited)
   - Go to: rocketreach.com
   - Enter person name + company
   - Shows likely email + phone
   - Verification score (higher = more confident)

3. **Email Finder Chrome Extension** (free)
   - Install: Hunter.io extension
   - Visit LinkedIn profile
   - Extension suggests email format

4. **Company Email Pattern** (manual)
   - Check company careers page: sometimes recruiters list email (firstname@company.com)
   - Common patterns:
     - firstname@company.com
     - f.lastname@company.com
     - firstnamelastname@company.com

5. **LinkedIn Direct Message** (fallback)
   - If email not found, use LinkedIn DM
   - Subject line: "[Role] + Your Background"
   - Message: See outreach-campaign.md templates

---

## Step 3: Company Recruiting Contact Info (Verified)

**For direct recruiting lines (no person needed):**

### Anthropic
- **General**: careers@anthropic.com
- **Job postings**: anthropic.com/careers
- **Apply method**: Greenhouse (greenhouse.io/anthropic)

### Capital One
- **Phone**: 1-800-304-9102
- **Email**: RecruitingAccommodation@capitalone.com
- **Apply method**: capitalonecareers.com

### BlackRock
- **Careers site**: careers.blackrock.com
- **Fraud alert**: reportascam@blackrock.com
- **Apply method**: Direct via careers portal
- **Note**: Only contact from @blackrock.com addresses

### Citi
- **Careers site**: jobs.citi.com
- **Apply method**: Direct via jobs portal
- **Note**: Contact info usually on job posting

### T. Rowe Price
- **Careers site**: troweprice.com/careers
- **Apply method**: Direct via careers portal
- **LinkedIn**: Check job postings for recruiter name

---

## Example: Completed Contact List (Anthropic)

```
# Anthropic Contacts â€” Engineering Manager, Enterprise

## Tier 1: Direct Hiring
- **Hiring Manager**: [Find via LinkedIn search "Anthropic" "Engineering Manager" "Enterprise"]
  - Name: [to find]
  - Title: Engineering Manager, Enterprise
  - LinkedIn: [copy URL]
  - Email: [use Hunter.io or pattern guess]
  - Status: Contacted on [date]

## Tier 2: Team Credibility
- **Senior Engineer**: [Find via same search, look for "Senior" or IC]
  - Name: [to find]
  - Title: Senior Software Engineer
  - LinkedIn: [copy URL]
  - Email: [use Hunter.io]
  - Status: Contacted on [date]

## Tier 3: Recruiter
- **Technical Recruiter**: [Find via LinkedIn, filter "Recruiter" + "Anthropic"]
  - Name: [to find]
  - Title: Technical Recruiter
  - LinkedIn: [copy URL]
  - Email: careers@anthropic.com (fallback)
  - Status: Contacted on [date]

## Outreach Schedule
- Day 1: Hiring Manager (direct ask)
- Day 2: Senior Engineer (credibility)
- Day 3: Recruiter (coordinate)
```

---

## Tools to Set Up (One-Time)

1. **Hunter.io** â€” Free account (50 searches/month)
   - Sign up: hunter.io
   - Install browser extension
   - Save Chrome shortcut

2. **RocketReach** â€” Optional (limited free tier)
   - Sign up: rocketreach.com
   - Free tier: 5-10 searches/month

3. **LinkedIn** â€” Already have it
   - Set up saved searches:
     - "Anthropic" "recruiter"
     - "Capital One" "AI engineer"
     - etc.

---

## Time Investment

- **Per company:** ~15 min (5 LinkedIn + 5 email finding + 5 recording)
- **For all 5 Tier 1 targets:** ~1.25 hours
- **ROI:** 15-20 warm contacts to reach out to

---

## Integration with /career-ops outreach-campaign

Once you have contact names + emails:

```bash
/career-ops outreach-campaign Anthropic "Engineering Manager, Enterprise"
```

The mode will use the contacts you found to generate:
- Personalized message drafts
- Optimal outreach sequence
- Follow-up timings

---

## Next: Run This Now

Pick one company (start with **Anthropic**):

1. Open LinkedIn
2. Search: `"Anthropic" "Engineering Manager"`
3. Record 4-6 people (names + LinkedIn URLs)
4. Use Hunter.io to find emails
5. Fill in this template
6. Save to `data/outreach/anthropic-contacts.md`

**Time: 15 min for first company**

Once you do one, the pattern is fast for the rest.

Ready to start?
