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

Before any outreach about work, money, gigs, contracts, or jobs, check the recipient against the South Park Commons pando member directory and South Park Commons Slack.

- If the person is SPC-affiliated, do not use a work pitch for that contact.
- If the check is unclear or unavailable, treat the contact as `blocked` for the work pitch until the affiliation is resolved.
- If you still want to reach out, use only a non-work reconnect, academic, or community angle.
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
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-05

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
next_followup: Only if he accepts or replies.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-05

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
next_followup: Only after a reply or connection acceptance.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-05

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
next_followup: Only if he accepts or replies.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-05

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
status: ready to send
next_followup: Only after a response or connection acceptance.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
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
status: ready to send
next_followup: Only if she accepts or replies.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
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
status: ready to send
next_followup: Only after a response or connection acceptance.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
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
status: ready to send
next_followup: Only after connection acceptance or a direct reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
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

### Plaid - Wen Yao

contact: Wen Yao
relationship: cold hiring-manager target; ML/AI Lead at Plaid and Machine Learning Engineering Manager for Data Foundation & AI / Credit per public LinkedIn profile snippets.
lane: hiring-manager
source_refs: https://www.linkedin.com/in/wen-yao-a1497715 ; https://www.linkedin.com/posts/wen-yao-a1497715_plaid-senior-data-scientist-data-foundations-activity-7451077582076198912-D3Qp ; https://plaid.com/careers/ ; reports/024-plaid-2026-07-06-staff-ml-engineer-research-scientist-dfai.md ; reports/025-plaid-2026-07-06-senior-machine-learning-engineer-credit.md
last_touch: LinkedIn connection note sent 2026-07-06 from Modal / Plaid post-application send packet.
why_now: I applied on 2026-07-06 to Plaid's Staff Machine Learning Engineer (Research Scientist) - DFAI and Senior Machine Learning Engineer - Credit roles.
hook: Wen publicly posted that Plaid is hiring Senior ML Engineer / Research Scientists for the Data Foundation AI team, with a rare research-plus-production systems scope.
proof_point: I have production ML systems experience plus TACC-scale distributed modeling and validation work, which maps to research that ships.
ask: Ask whether it is worth a quick connect or whether there is a better owner for the Plaid ML loop.
avoid: Sending a long founder biography or mentioning every Plaid role at once.
status: sent
next_followup: Only after a reply or connection acceptance; otherwise first follow-up no earlier than 2026-07-10.
spc_affiliation: clear_no_match_local_spc_export
spc_checked_at: 2026-07-06

### Plaid - Rico Curry

contact: Rico Curry
relationship: cold recruiter/router target; public LinkedIn snippet says Recruiting at Plaid and currently recruiting Data Scientists, AI/LLM/NLP Research Scientists, AI Engineers, Applied ML, Machine Learning Engineering, and Product.
lane: recruiter
source_refs: https://www.linkedin.com/in/rico-curry-20516040 ; https://plaid.com/careers/ ; reports/024-plaid-2026-07-06-staff-ml-engineer-research-scientist-dfai.md ; reports/025-plaid-2026-07-06-senior-machine-learning-engineer-credit.md
last_touch: LinkedIn connection note sent 2026-07-06 from Modal / Plaid post-application send packet.
why_now: I applied on 2026-07-06 to two current Plaid ML roles and need a clean recruiting route without over-contacting the company.
hook: Rico's public profile snippet directly names Plaid recruiting across AI/LLM/NLP, Applied ML, and Machine Learning Engineering.
proof_point: I am a senior ML engineer with production AI systems, Python/PyTorch, and TACC-scale distributed modeling experience.
ask: Ask whether he owns the Plaid ML searches or can route me to the right recruiting owner.
avoid: Contacting multiple Plaid recruiters with the same copy or implying he personally owns both roles.
status: sent
next_followup: Only after a reply or connection acceptance; otherwise first follow-up no earlier than 2026-07-10.
spc_affiliation: clear_no_match_local_spc_export
spc_checked_at: 2026-07-06

### Modal - Julia Tupy

contact: Julia Tupy
relationship: cold talent/router target; public LinkedIn snippet identifies her as a Talent Partner at Modal in New York.
lane: recruiter
source_refs: https://www.linkedin.com/in/julia-tupy-a0b009b4 ; https://modal.com/company ; reports/021-modal-2026-07-06-forward-deployed-engineer-ml.md ; reports/022-modal-2026-07-06-forward-deployed-engineer-systems.md ; reports/023-modal-2026-07-06-mts-platform-engineering.md
last_touch: LinkedIn connection note sent 2026-07-06 from Modal / Plaid post-application send packet.
why_now: I applied on 2026-07-06 to Modal's Forward Deployed Engineer - ML, Forward Deployed Engineer - Systems, and MTS Platform Engineering roles.
hook: Julia is a named Modal talent partner, and Modal's company page lists active AI infrastructure/platform engineering roles in New York.
proof_point: I have built production ML stacks and run TACC-scale distributed jobs, which maps to Modal's AI infrastructure and platform work.
ask: Ask whether there is a best person to route the Modal applications to.
avoid: Reaching out to Modal's CEO first or sending separate notes for every Modal application.
status: sent
next_followup: Only after a reply or connection acceptance; otherwise first follow-up no earlier than 2026-07-10.
spc_affiliation: clear_no_match_local_spc_export
spc_checked_at: 2026-07-06

## Next 10 post-application outreach

Date: 2026-07-06

Packet: `data/outreach/next10-post-application-2026-07-06-send-packet.md`

Status: sent_with_correction

Channel: LinkedIn via authenticated in-app browser.

SPC gate: clear_no_match_local_spc_export for all 10 names against `data/spc-contacts.tsv` and `data/archive/south-park-commons-members-2026-07-05.md`.

Browser check: LinkedIn profile pages verified signed-in on 2026-07-06. Each valid company route was sent and verified as Pending or conversation text sent.

Contacts:

- Pradeep Dorairaj - Snowflake, Engineering Manager; post-application route for #26 Snowflake ML Platform Inference.
- Robbie Maasberg - Graphcore, Principal Talent Partner; post-application route for #27 Graphcore AI Platform Architect.
- Stella E. / Stella Ernster - Judi Health, Talent Acquisition Manager; post-application route for #28 Capital Rx / Judi Health Senior Applied AI/ML Scientist.
- Muskan Kukreja - Checkr, ML/AI leader; post-application route for #29 Checkr Staff Applied AI Engineer.
- Marwan Mattar - Sigma, VP of AI; post-application route for #30 Sigma Senior AI/ML Engineer.
- Chris Westerhold - Thoughtworks, Global Practice Director; replacement post-application route for #31 Thoughtworks Principal AI Architect.
- James Melville - Vivodyne, software/data science route; post-application route for #32 Vivodyne AI Senior Scientist.
- Mor Adato - DoubleVerify, Senior Director of Engineering / Analytics Platform; post-application route for #33 DoubleVerify Data Platform & AI Enablement.
- Debarshi Kar - Instawork, CTO; post-application route for #34 Instawork Robotics ML Engineer.
- Laura Woodruff - Neuralink, Senior Technical Recruiter; post-application route for #35 Neuralink Machine Learning Engineer.

Outcome:

- Sent and verified valid company routes for Snowflake, Graphcore, Capital Rx / Judi Health, Checkr, Sigma Computing, Thoughtworks, Vivodyne, DoubleVerify, Instawork, and Neuralink.
- Jaydeep Chakrabarty was sent before LinkedIn post-send verification showed his current company as Piramal Finance, not Thoughtworks. This is logged as an extra misrouted touch and not counted as the Thoughtworks route.
- Chris Westerhold was then verified as a current Thoughtworks AI-transformation leader and sent as the corrected Thoughtworks route.
- Muskan Kukreja's direct Message route surfaced a Premium/InMail upsell, so the paid/direct message path was avoided and a normal connection note was sent instead.
- Result artifact: `data/artifacts/next10-outreach-results-2026-07-06.json`.
