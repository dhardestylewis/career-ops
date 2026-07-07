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

## Send-State Model

| State | Minimum evidence | Stop condition / next step |
|---|---|---|
| `research` | You cannot yet fill the required questions from actual source material. | Keep gathering sources; do not draft or send. |
| `blocked` | The contact is SPC-affiliated, the check is unclear, the access path is blocked, or the user said no contact. | Do not send the work pitch; use only a non-work reconnect or stop. |
| `draft` | The source-backed fields are mostly filled, but the wording or routing still needs refinement. | Continue drafting only; do not send yet. |
| `ready` | `why_now`, `hook`, `proof_point`, `ask`, and the current-role / SPC checks are all source-backed. | Send only after the session preflight clears. |
| `sent` | The message was sent and logged. | Move to waiting. |
| `waiting` | The send went out and a follow-up date is set. | Follow the cadence only; do not re-pitch. |
| `replied` | A response arrived. | Answer directly or pause for human judgment. |
| `no-contact` | The user explicitly said no contact or watch only. | Do not revisit unless the instruction changes. |

## South Park Commons Gate

- Before any outreach about work, money, gigs, contracts, or jobs, check the recipient against the South Park Commons directory export first.
- If the export gives a clean no-match and the contact is not SPC-adjacent, that is enough to proceed; use live Pando or Slack only as a tie-breaker when the result is ambiguous, OCR-noisy, or SPC-adjacent.
- If the result is still unclear after the directory pass, use only a non-work reconnect, academic, or community angle.
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
action_state:
next_followup:
spc_affiliation:
spc_checked_at:
```

## Send / No-Send Gate

- Send only if `action_state` is `ready` and `why_now`, `hook`, `proof_point`, and `ask` are filled from sources.
- Do not send if the hook is generic, the relationship is unclear, or the last touch is unknown.
- For warm contacts, require at least one prior thread or shared history plus one current reason to reach out.
- If a send is a no-response follow-up, do not send before the recorded `next_followup` date; same-day bumps are blocked.
- For cold contacts, require one strong public-work hook and one very small ask.
- For professors and former instructors, prefer a public-work reference when one exists. Good hooks include a paper, talk, lecture, lab page, blog post, or editorship.
- If a contact has changed roles, treat that as a reconnect signal and rewrite the opener around the new role.
- If `action_state` is `blocked`, `research`, or `no-contact`, do not send the work pitch.
- If a reply changes strategy or is ambiguous, pause and notify the user instead of guessing.

## Mailbox Review Note

- Mailbox access in this session only covered `danielhardestylewis@utexas.edu` in UTmail.
- Paola Passalacqua: two same-day UTmail threads were present, with the latest send now logged as `Reconnecting after TACC`. No blocker.
- Christopher Munsell: two same-day UTmail threads were present, with the latest send now logged as `Thank you from GSAPP`. No blocker.
- Jeffrey Shaman: no UTmail match in this session. Blocker is missing source-backed mailbox evidence in this worktree; next step is Columbia mailbox access or another source-backed row before drafting.
- Alex de Sherbinin: no UTmail match in this session. Blocker is the pending LinkedIn route outside this worktree; next step is to wait for the connection or recover the separate tracker entry before any resend.

## Built In Shortlist

### LTS - Catherine Del Hierro

contact: Catherine Del Hierro
relationship: cold target; current LTS recruiter / talent acquisition lead
lane: recruiter
source_refs: https://lts.com/lts-careers/ ; https://www.linkedin.com/in/catherinedelhierro
last_touch: none
why_now: LTS posted Lead Forward Deployed Engineer and Senior FDE openings within the last few days.
hook: She leads hiring for the company that owns the current FDE opening.
proof_point: Homecastr plus TACC show I can ship production ML systems and handle public-interest infrastructure work.
ask: Send a short LinkedIn note asking who owns the FDE hiring and whether the role is the best entry point.
avoid: Overexplaining the whole background, asking about compensation first, or turning it into a long pitch.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### LTS - David Wilmot

contact: David Wilmot
relationship: cold executive sponsor; Chief Medical Officer at LTS
lane: executive / boss-of-boss
source_refs: https://lts.com/ ; https://www.linkedin.com/in/drdavidwilmot
last_touch: none
why_now: LTS is hiring for mission-critical healthcare IT and public-health delivery roles right now.
hook: His current role sits at the intersection of healthcare delivery and operational reliability.
proof_point: TACC and Homecastr show I build reliable systems for high-stakes physical-world decisions.
ask: Short reconnect / connect note asking for the right way to think about the FDE lane at LTS.
avoid: A generic job application blast or a request that feels like lobbying a CMO.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Accenture - James Pickard

contact: James Pickard
relationship: cold recruiter target; Talent Acquisition Lead at Accenture
lane: recruiter
source_refs: https://www.accenture.com/us-en/careers/jobsearch ; https://www.linkedin.com/in/jameshpickard
last_touch: none
why_now: Accenture is actively surfacing AI Transformation & Solutions roles and related AI / data careers.
hook: He owns sourcing and recruiting for the kind of enterprise AI transformation lane this role sits in.
proof_point: I have shipped production ML, validated models rigorously, and worked across technical and non-technical stakeholders.
ask: Ask for the right owner for the AI Transformation & Solutions Lead role and whether the team is open to a brief connect.
avoid: Sending a long technical bio or leading with salary.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Accenture - Jim Murrin

contact: Jim Murrin
relationship: cold executive search target; global executive search leader in AI and data
lane: executive / boss-of-boss
source_refs: https://www.linkedin.com/in/jimmurrin ; https://www.accenture.com/us-en/careers
last_touch: none
why_now: Accenture is leaning hard into AI and data careers, and this role is an enterprise transformation lane rather than a narrow dev job.
hook: His current remit gives him an executive view of AI and data talent across the firm.
proof_point: Homecastr, Summit Geospatial, and TACC give me a strong applied-systems story for transformation work.
ask: Short connect note asking who the best person is for the AI transformation lane.
avoid: A generic "please refer me" ask or a long summary of all prior work.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Figma - Alyssa Alvarez

contact: Alyssa Alvarez
relationship: cold recruiter target; recruiting @ Figma
lane: recruiter
source_refs: https://www.figma.com/careers/ ; https://www.linkedin.com/in/alyssa-alvarez1
last_touch: none
why_now: Figma has a live Software Engineer, AI Product (London, United Kingdom) opening.
hook: She is recruiting at Figma in the San Francisco Bay Area while the AI Product London role is live.
proof_point: Production ML, evaluation-heavy infrastructure, and applied product work map well to Figma's AI product lane.
ask: Short LinkedIn note asking who owns the AI Product London search and whether I should apply first or route to the right teammate.
avoid: A long resume dump or a generic "please refer me" ask.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Harvey - Kimberly Taylor

contact: Kimberly Taylor
relationship: cold recruiter target; Talent @ Harvey
lane: recruiter
source_refs: https://www.harvey.ai/ ; https://jobs.ashbyhq.com/harvey/fc038666-be6f-4365-be8d-fb46e520473d ; https://www.linkedin.com/in/kimberlytaylor212
last_touch: none
why_now: Harvey's Staff Software Engineer, Agents role is live in San Francisco and fits the user's agentic-infra background.
hook: She leads recruiting for Harvey's Central AI org and is based in the New York City Metropolitan Area.
proof_point: I build production ML systems, agents, and reliability-heavy infrastructure, which maps well to Harvey's agents work.
ask: Short note asking whether the Agents role is the right entry point and who owns the search.
avoid: A broad company pitch or leading with compensation.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Notion - Janelle Bullock

contact: Janelle Bullock
relationship: cold recruiter target; Technical Recruiter at Notion
lane: recruiter
source_refs: https://www.notion.com/careers ; https://www.linkedin.com/in/janellebullock
last_touch: none
why_now: Notion is actively hiring AI Workflows and other engineering roles in San Francisco and New York.
hook: Her profile shows she is a Technical Recruiter at Notion in New York.
proof_point: My background in ML infrastructure, distributed systems, and applied product work fits Notion's AI Workflows lane.
ask: Short LinkedIn note asking who owns the AI Workflows search and whether the NY/SF role is open to my profile.
avoid: A general "I'm interested in Notion" message without a specific role.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Mistral - Etienne Metzger

contact: Etienne Metzger
relationship: cold executive sponsor; Head, TA @ Mistral AI
lane: recruiter
source_refs: https://mistral.ai/careers/ ; https://jobs.lever.co/mistral/94173e13-3050-4044-862a-e8dfc2deda5e ; https://www.linkedin.com/in/etienne-metzger-b3500333
last_touch: none
why_now: Mistral has live Paris / London frontier-AI roles, including Applied AI, Forward Deployed Machine Learning Engineer - EMEA.
hook: He is Head, TA at Mistral AI in Paris and the company is actively hiring across Paris and London.
proof_point: I have production ML, infrastructure, and forward-deployed systems experience that maps to Mistral's applied-AI lane.
ask: Short note asking whether the EMEA FDE or research-engineering lane is the better entry point.
avoid: A long pitch or leading with a job ask before the role fit is clear.
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Billtrust - Iliana Lytton

contact: Iliana Lytton
relationship: cold recruiter target; Lead Talent Acquisition Partner at Billtrust
lane: recruiter
source_refs: https://www.billtrust.com/careers/job-openings ; https://www.linkedin.com/in/iliana-lytton
last_touch: none
why_now: Billtrust has current openings for VP Product Management - Applied Intelligence and VP Product Management - Payments.
hook: She is the current talent acquisition lead and the best routing point into the product org.
proof_point: I can speak product and systems, not just model training, which fits a product leadership conversation.
ask: Ask who owns the Applied Intelligence and Payments product searches and whether a connect is useful.
avoid: Jamming the whole founder history into the first note.
status: research
next_followup: Only after a response or connection acceptance.
spc_affiliation: clean no-match in archived SPC PDF; work lane still held on location
spc_checked_at: 2026-07-05

### Billtrust - Lee An Schommer

contact: Lee An Schommer
relationship: cold executive sponsor; Chief Product Officer at Billtrust
lane: executive / boss-of-boss
source_refs: https://www.billtrust.com/about ; https://www.linkedin.com/in/leeanschommer
last_touch: none
why_now: The Applied Intelligence role is a CPO-level mandate and the company is actively positioning AI as a core product motion.
hook: She owns the product strategy umbrella above the open Applied Intelligence and Payments roles.
proof_point: Homecastr and Columbia show I can move from modeling to productized decision support with measurable outcomes.
ask: Short connect note asking how the product org is thinking about AI capability versus product ownership.
avoid: Asking for a job in the opener or sounding like a blanket product pitch.
status: research
next_followup: Only if she accepts or replies.
spc_affiliation: clean no-match in archived SPC PDF; work lane still held on location
spc_checked_at: 2026-07-05

### Trexquant - Harrison Zolot

contact: Harrison Zolot
relationship: cold recruiter target; Head of Talent Acquisition at Trexquant
lane: recruiter
source_refs: https://trexquant.com/careers/ ; https://www.linkedin.com/in/harrison-zolot-585213121
last_touch: none
why_now: Trexquant currently lists Quantitative Researcher roles and the hiring page is live.
hook: He owns the intake path for quant and research hiring.
proof_point: Columbia financial ML plus rigorous evaluation on physical-world ML systems show I can work in research-heavy environments.
ask: Ask for the best owner for the PhD-required Quantitative Researcher opening.
avoid: Pretending the PhD requirement is irrelevant or leading with unrelated founder history.
status: research
next_followup: Only after a response or connection acceptance.
spc_affiliation: clean no-match in archived SPC PDF; work lane still held on location
spc_checked_at: 2026-07-05

### Trexquant - Denis Lapitski

contact: Denis Lapitski
relationship: cold hiring-manager target; Director of Strategy Research at Trexquant
lane: hiring-manager
source_refs: https://trexquant.com/ ; https://www.linkedin.com/in/denislapitski
last_touch: none
why_now: The role is explicitly research-heavy and the company highlights researchers, traders, and developers on the career page.
hook: His current role sits in the research org that likely owns or influences the Quantitative Researcher posting.
proof_point: I bring a mix of ML, statistics, and engineering that maps to research iteration and deployment discipline.
ask: Short note asking whether he is the right person for the Quantitative Researcher search.
avoid: Overindexing on software engineering and ignoring the research angle.
status: research
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: clean no-match in archived SPC PDF; work lane still held on location
spc_checked_at: 2026-07-05

### Alexander Nevedovsky

contact: Alexander Nevedovsky
relationship: 1st-degree LinkedIn connection; existing thread from March 26, 2026
lane: non-work product-interest reply
source_refs: https://www.linkedin.com/in/ednevsky/ ; https://www.linkedin.com/feed/update/urn:li:activity:7475605007585775616/
last_touch: Alexander sent a March 26, 2026 update about the No Cap acquisition; replied on July 5, 2026 at 9:33 PM
why_now: He posted about an Audos experiment that lets founders build for free and invited DMs for a referral link.
hook: Current Audos experiment, especially the free-to-build plus rev share model.
proof_point: I build ML systems at Homecastr.
ask: Share a referral link or let me try Audos.
avoid: Turning this into a work pitch or overexplaining the background.
status: sent
action_state: sent
next_followup: Wait for his reply; only follow up if he responds or asks for more context.
spc_affiliation: not checked; non-work lane
spc_checked_at: n/a

### Giles Davey / Candidate Labs

contact: Giles Davey
relationship: 1st-degree LinkedIn connection; current recruiter contact
lane: recruiter
source_refs: live LinkedIn profile text for `https://www.linkedin.com/in/gilesdavey/`
last_touch: 2026-07-06
why_now: I saw his move to Candidate Labs and wanted to reconnect.
hook: His profile highlights AI/LLMOps workflows, talent systems, and recruiting ops.
proof_point: My resume shows production ML, distributed systems, and evaluation-heavy infrastructure.
ask: Ask whether he is still the right person for AI/ML recruiting lanes and whether he is open to receiving my CV.
avoid: Referencing the stale DeepMind role, overexplaining, or mentioning SPC.
status: waiting
action_state: waiting
next_followup: 2026-07-13 if there is no reply.
spc_affiliation: no match in archived SPC PDF; user confirmed no relation
spc_checked_at: 2026-07-06

### Weihao Kong / Google Research

contact: Weihao Kong
relationship: 2nd-degree LinkedIn contact; research peer and TabFM author
lane: peer / research
source_refs: live LinkedIn profile `https://www.linkedin.com/in/weihao-kong-a0514338/`; Google Research blog `Introducing TabFM: A zero-shot foundation model for tabular data` (June 30, 2026)
last_touch: 2026-07-06
why_now: I just submitted a nearby Google Cloud AI application, and his TabFM / TimesFM work is the closest public bridge to the tabular foundation-model lane.
hook: His profile says he builds tabular and time-series foundation models at Google Research, and the June 30 TabFM post is the current concrete artifact.
proof_point: The candidate has 8 years of ML engineering, backend, and distributed systems work, plus production ML, eval, reliability, and LLM agent infrastructure in `data/cv.md`.
ask: Short connect or message asking for his take on tabular foundation models and, if relevant, which Google team or role is the best one to watch.
target_roles:
- Staff Software Engineer, BigQuery Agentic AI - already submitted; closest live BigQuery / TabFM match.
- Staff Research, Generative AI, Cloud AI Research, Co-Scientist - live, strong technical overlap, but Zurich-based.
- Research Scientist, Google Research - live, but the PhD and publication gate make it a poor fit for this profile.
avoid: A direct job ask, overexplaining the application, or anything SPC-related.
status: waiting
action_state: waiting
next_followup: 2026-07-13
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-06

### Melany Reyes / Zigi App

contact: Melany Reyes
relationship: recruiter / talent lead at Zigi App
lane: recruiter / work
source_refs: current LinkedIn messaging thread; recruiter reply on 2026-07-06 noting the role is in Guatemala and hybrid
last_touch: 2026-07-06
why_now: The recruiter replied and revealed the role is location-bound to Guatemala, which does not match the user's current New York base.
hook: The role is an in-country Guatemala hybrid position, so the location requirement is now the main signal.
proof_point: The candidate's data engineering and infrastructure background is credible, but geography is the blocker here.
ask: None unless the user explicitly says Guatemala relocation or in-country work is acceptable.
avoid: Continuing a normal work pitch or treating this as a standard follow-up.
status: blocked
action_state: blocked
next_followup: Do not follow up unless the user explicitly approves relocation or in-country availability.
spc_affiliation: not checked; blocked on geography before any work pitch
spc_checked_at: 2026-07-06

### Jasmine Salazar / Figma

contact: Jasmine Salazar
relationship: 2nd-degree LinkedIn contact; Technical Recruiter at Figma
lane: recruiter / work
source_refs: https://www.linkedin.com/in/jasmine-salazar-a7b0b855/ ; https://boards.greenhouse.io/figma/jobs/5551697004?gh_jid=5551697004
last_touch: none
why_now: I just applied to Figma's Software Engineer, AI Product (London) role, and her current profile shows she is the technical recruiter at Figma.
hook: Her current LinkedIn profile shows she is a Technical Recruiter at Figma in the San Francisco Bay Area.
proof_point: I build production ML systems and eval-heavy infrastructure, and I am New York-based.
ask: Connect if she is the right contact for the role, or route me to the right person.
avoid: A long bio, generic corporate language, or mentioning a stale thread.
status: sent
action_state: waiting
next_followup: 2026-07-14 if there is no acceptance or reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07

### Andre Nguyen / Harvey

contact: Andre Nguyen
relationship: 2nd-degree LinkedIn contact; Talent @ Harvey
lane: recruiter / work
source_refs: https://www.linkedin.com/in/andrevnguyen/ ; https://jobs.ashbyhq.com/harvey/3931a1b7-573d-4bd8-8fed-3fa8132c3201 ; https://jobs.ashbyhq.com/harvey/8e513820-55f8-4cbd-8bdd-28a67992469c ; https://jobs.ashbyhq.com/harvey/b774c88e-5d8f-48d3-aed7-948f2e4292b7
last_touch: none
why_now: I just applied to Harvey's Staff Software Engineer openings in Frontend, Full Stack, and Backend, and his current profile shows he is talent at Harvey.
hook: His current LinkedIn profile shows he is Talent @ Harvey in San Francisco, California, and the Harvey company page is current on the profile.
proof_point: I build production ML systems and infra-heavy products, and I am New York-based.
ask: Connect if he is the right contact for the engineering search, or route me to the right owner.
avoid: A long pitch, a generic "let me know" note, or treating this as a warm thread.
status: sent
action_state: waiting
next_followup: 2026-07-14 if there is no acceptance or reply.
spc_affiliation: clean no-match in archived SPC PDF; not SPC-adjacent
spc_checked_at: 2026-07-07
