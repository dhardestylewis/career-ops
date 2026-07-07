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

### Ali Hirsa

contact: Ali Hirsa
relationship: research advisor at Columbia; warm academic collaborator
lane: warm-academic
source_refs: data/archive/submission_anthropic_fellows_2026.json#references[1] ; https://ieor.columbia.edu/content/ali-hirsa ; data/cv.md
last_touch: 2026-07-07
why_now: His current Columbia financial engineering work gives a sharper public hook than a generic check-in.
hook: His role directing Financial Engineering and the Center for AI in Business Analytics & FinTech.
proof_point: My Columbia latent-factor modeling work and Homecastr's model-validation discipline.
ask: A brief reconnect and any research direction he wants me to keep in mind.
avoid: Saying only "the Columbia work" without naming the finance / AI angle.
status: sent
action_state: sent
next_followup: 2026-07-16
spc_affiliation: not checked; non-work lane
spc_checked_at: n/a

## Built In Shortlist

### LTS - Catherine Del Hierro

contact: Catherine Del Hierro
relationship: cold target; current LTS recruiter / talent acquisition lead
lane: recruiter
source_refs: https://lts.com/lts-careers/ ; https://www.linkedin.com/in/catherinedelhierro
last_touch: 2026-07-06
why_now: LTS posted Lead Forward Deployed Engineer and Senior FDE openings within the last few days.
hook: She leads hiring for the company that owns the current FDE opening.
proof_point: Homecastr plus TACC show I can ship production ML systems and handle public-interest infrastructure work.
ask: Ask for the right owner for the FDE hiring and whether the role is the best entry point.
avoid: Overexplaining the whole background, asking about compensation first, or turning it into a long pitch.
status: sent
action_state: sent
next_followup: 2026-07-13
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
last_touch: 2026-07-07
why_now: Accenture is actively surfacing AI Transformation & Solutions roles and related AI / data careers.
hook: He owns sourcing and recruiting for the kind of enterprise AI transformation lane this role sits in.
proof_point: I have shipped production ML, validated models rigorously, and worked across technical and non-technical stakeholders.
ask: Ask for the right owner for the AI Transformation & Solutions Lead role and whether the team is open to a brief connect.
avoid: Sending a long technical bio or leading with salary.
status: sent
action_state: sent
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
last_touch: 2026-07-06
why_now: Billtrust has current openings for VP Product Management - Applied Intelligence and VP Product Management - Payments.
hook: She is the current talent acquisition lead and the best routing point into the product org.
proof_point: I can speak product and systems, not just model training, which fits a product leadership conversation.
ask: Ask who owns the Applied Intelligence and Payments product searches and whether a connect is useful.
avoid: Jamming the whole founder history into the first note.
status: sent
action_state: sent
next_followup: 2026-07-13
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
last_touch: 2026-07-06
why_now: Trexquant currently lists Quantitative Researcher roles and the hiring page is live.
hook: He owns the intake path for quant and research hiring.
proof_point: Columbia financial ML plus rigorous evaluation on physical-world ML systems show I can work in research-heavy environments.
ask: Ask for the best owner for the PhD-required Quantitative Researcher opening.
avoid: Pretending the PhD requirement is irrelevant or leading with unrelated founder history.
status: sent
action_state: sent
next_followup: 2026-07-13
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

### Betaworks

contact: Betaworks
relationship: cold founder-ecosystem target; public betaworks team / camp / info route
lane: founder-ecosystem
source_refs: https://www.betaworks.com/team ; https://www.betaworks.com/contact ; https://www.linkedin.com/in/jborthwick ; https://www.linkedin.com/in/jordanrcrook ; https://www.linkedin.com/in/asvehaug
last_touch: 2026-07-06
why_now: Betaworks is actively running AI Camp around the new agent economy and still frames itself as a startup studio for early-stage consumer tech.
hook: Betaworks combines investing, community, and operator support around Camp.
proof_point: Homecastr is building decision support for housing and infrastructure with production forecasting and evaluation.
ask: Ask for the best person on the Camp or founder-ecosystem side for a quick connect.
avoid: Long background dumps, a job ask, or multiple asks.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Betaworks named contacts

These are the public team-page contacts behind the Betaworks ecosystem lane. The live browser session in this worktree is not authenticated for LinkedIn, so direct named-person outreach is blocked here for now.

#### John Borthwick

contact: John Borthwick
relationship: cold founder-ecosystem target; Betaworks founder and managing partner
lane: founder-ecosystem
source_refs: https://www.betaworks.com/team ; https://www.betaworks.com/camp/application ; https://www.betaworks.com/writing/apply-to-betaworks-ai-camp-app-layer-for-500k-in-funding
last_touch: 2026-07-06
why_now: Betaworks is actively running AI Camp: The New Agentic Economy.
hook: He leads the firm and the Camp thesis.
proof_point: Homecastr is building decision support for housing and infrastructure with production forecasting and evaluation.
ask: Ask for the best person on Camp or founder-ecosystem side for a quick connect.
avoid: Long background dumps, a job ask, or multiple asks.
status: blocked
action_state: blocked
next_followup: n/a until a live LinkedIn or email route is available
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

#### Jordan Crook

contact: Jordan Crook
relationship: cold founder-ecosystem target; Betaworks partner
lane: founder-ecosystem
source_refs: https://www.betaworks.com/team ; https://www.betaworks.com/writing ; https://www.betaworks.com/event/inside-betaworks-with-jordan-crook
last_touch: 2026-07-06
why_now: Betaworks is still publishing around AI Camp and the new agent economy.
hook: She leads deals and writes the public Betaworks Camp / thesis pieces.
proof_point: Homecastr is building decision support for housing and infrastructure with production forecasting and evaluation.
ask: Ask for the best person on the Camp or founder-ecosystem side for a quick connect.
avoid: Long background dumps, a job ask, or multiple asks.
status: blocked
action_state: blocked
next_followup: n/a until a live LinkedIn or email route is available
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

#### Analisa Svehaug

contact: Analisa Svehaug
relationship: cold founder-ecosystem target; Betaworks director
lane: founder-ecosystem
source_refs: https://www.betaworks.com/team ; https://www.linkedin.com/in/asvehaug
last_touch: 2026-07-06
why_now: She runs the Camp program and handles the office / event operations around it.
hook: She is the public Camp operator on the team page.
proof_point: Homecastr is building decision support for housing and infrastructure with production forecasting and evaluation.
ask: Ask for the best person on the Camp or founder-ecosystem side for a quick connect.
avoid: Long background dumps, a job ask, or multiple asks.
status: blocked
action_state: blocked
next_followup: n/a until a live LinkedIn or email route is available
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Kelsey Richmond

contact: Kelsey Richmond
relationship: warm community contact from the Newlab application thread; Senior Community Manager
lane: founder-ecosystem
source_refs: https://www.newlab.com/team ; Gmail thread "Newlab Contact Form Submission" (threadId 19f379a583478034)
last_touch: 2026-07-06
why_now: She explicitly invited anything else she can do, and the application is already in.
hook: Her current Senior Community Manager role and the member / ecosystem routing on Newlab's team page.
proof_point: Homecastr's deck, screenshots, and application are already in the loop, and the product is focused on housing and infrastructure decision support.
ask: Ask for the best person on the ecosystem / pilot side or the right next step.
avoid: Repeating the submitted application confirmation or turning it into a broad pitch.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

## Wave 3 Named Contacts

### David Luberoff

contact: David Luberoff
relationship: cold housing-studies routing target; Deputy Director of the Harvard Joint Center for Housing Studies
lane: lab-research
source_refs: https://www.gsd.harvard.edu/person/david-luberoff/ ; https://www.jchs.harvard.edu/about/staff ; https://www.jchs.harvard.edu/about ; https://www.jchs.harvard.edu/students/support-housing-focused-studios-and-project-based-classes-graduate-school-design
last_touch: 2026-07-06
why_now: JCHS is actively publishing housing research and supports housing-focused studios and project-based classes.
hook: His role directly owns fellowships, events, and educational outreach at the center.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the right faculty or student-support routing for a short conversation.
avoid: A generic Harvard note without the housing-studies and studio-routing angle.
status: sent
action_state: sent
next_followup: only if he replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Ingrid Gould Ellen

contact: Ingrid Gould Ellen
relationship: cold housing-policy routing target; Faculty Director of the NYU Furman Center
lane: lab-research
source_refs: https://www.furmancenter.org/people/ingrid-gould-ellen/ ; https://www.furmancenter.org/about/team/ ; https://www.furmancenter.org/about/
last_touch: 2026-07-06
why_now: The Furman Center is centered on neighborhoods, housing, and residential segregation.
hook: Her role owns the housing-policy research lane at Furman.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Furman contact path or a short routing pointer.
avoid: A broad NYU outreach note without the housing-policy bridge.
status: sent
action_state: sent
next_followup: only if she replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Giselle Routhier

contact: Giselle Routhier
relationship: cold lab-routing target; Director of the NYU Health x Housing Lab
lane: lab-research
source_refs: https://med.nyu.edu/departments-institutes/population-health/divisions-sections-centers/health-behavior/community-service-plan/all-programs/health-x-housing-lab/our-team ; https://med.nyu.edu/faculty/giselle-routhier ; https://med.nyu.edu/departments-institutes/population-health/divisions-sections-centers/health-behavior/community-service-plan/all-programs/health-x-housing-lab/research
last_touch: 2026-07-06
why_now: The lab is actively working at the intersection of health, housing, and homelessness.
hook: She leads the health-and-housing lab and its research agenda.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best route into the lab or its partnership work.
avoid: A generic NYU note that ignores the health-and-housing focus.
status: sent
action_state: sent
next_followup: only if she replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Zhengzhen Tan

contact: Zhengzhen Tan
relationship: cold urban-tech routing target; Executive Director of the MIT Sustainable Urbanization Lab
lane: lab-research
source_refs: https://sul.mit.edu/ ; https://professional.mit.edu/programs/faculty-profiles/zhengzhen-tan ; https://cre.mit.edu/people/zhengzhen-tan/ ; https://sul.mit.edu/events
last_touch: 2026-07-06
why_now: The lab focuses on sustainable urbanization, digital innovation, and entrepreneurship.
hook: Her role owns the sustainable-urbanization and entrepreneurship lane at MIT.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best collaboration or engagement route.
avoid: A generic MIT note without the urbanization and city-systems angle.
status: sent
action_state: sent
next_followup: only if she replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Fabio Duarte

contact: Fabio Duarte
relationship: cold urban-tech routing target; Associate Director of MIT Senseable City Lab
lane: lab-research
source_refs: https://senseable.mit.edu/ ; https://dusp.mit.edu/people/fabio-duarte ; https://cre.mit.edu/people/fabio-duarte/
last_touch: 2026-07-06
why_now: Senseable City Lab is actively publishing around urban systems, mobility, and design.
hook: His role owns the research and design lane for the city lab.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask whether the lab is open to a short connect or collaboration pointer.
avoid: A broad MIT pitch that skips the city-lab overlap.
status: sent
action_state: sent
next_followup: only if he replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### John Wolf

contact: John Wolf
relationship: cold program-routing target; Associate Director of the UChicago Education Lab
lane: lab-research
source_refs: https://educationlab.uchicago.edu/staff/john-wolf/ ; https://educationlab.uchicago.edu/contact/ ; https://educationlab.uchicago.edu/about/
last_touch: 2026-07-06
why_now: The Education Lab is built around evidence-based, real-world program design and scaling.
hook: His role sits close to project and program routing inside the lab.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best route to the right staff or project lead.
avoid: A generic Chicago note that ignores the education-lab channel.
status: sent
action_state: sent
next_followup: only if he replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Carmelo Barbaro

contact: Carmelo Barbaro
relationship: cold program-routing target; Executive Director of the UChicago Inclusive Economy Lab
lane: lab-research
source_refs: https://urbanlabs.uchicago.edu/people?labs=inclusiveeconomy ; https://urbanlabs.uchicago.edu/labs/inclusiveeconomy ; https://urbanlabs.uchicago.edu/programs/contact-us
last_touch: 2026-07-06
why_now: The lab focuses on financial security and real economic opportunity.
hook: His role owns the inclusive-economy and program-routing lane.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the right partnership or staff contact.
avoid: A generic urban-policy note that does not mention the lab's economic-opportunity focus.
status: sent
action_state: sent
next_followup: only if he replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Katie Hill

contact: Katie Hill
relationship: cold executive-routing target; Executive Director of the UChicago Crime Lab
lane: lab-research
source_refs: https://crimelab.uchicago.edu/2024/10/welcome-katie-hill-our-new-executive-director/ ; https://crimelab.uchicago.edu/contact/ ; https://crimelab.uchicago.edu/about/
last_touch: 2026-07-06
why_now: The Crime Lab is actively working on data-driven public-safety and justice interventions.
hook: Her role owns the lab's executive and program-routing lane.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best current contact or program path.
avoid: A broad safety note without the lab and public-sector angle.
status: sent
action_state: sent
next_followup: only if she replies
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06
## Wave 4 Named Contacts

### Martha Fedorowicz

contact: Martha Fedorowicz
relationship: cold policy-routing target; Training and Technical Assistance Manager at Urban Institute
lane: lab-research
source_refs: https://www.urban.org/projects/policy-and-systems-change-compass/contact-us ; https://www.urban.org/author/martha-fedorowicz ; https://www.urban.org/expertise/training-and-technical-assistance
last_touch: none
why_now: The Policy and Systems Change Compass is built around helping local policymakers identify and implement solutions.
hook: She directs training and technical assistance on policy and systems change, affordable housing, and transportation.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Urban Institute contact path or a short routing pointer.
avoid: A generic Urban note that ignores the Compass and TA work.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Joseph Schilling

contact: Joseph Schilling
relationship: cold policy-routing target; Senior Research Associate at Urban Institute
lane: lab-research
source_refs: https://www.urban.org/author/joseph-schilling ; https://www.urban.org/projects/policy-and-systems-change-compass/contact-us ; https://www.urban.org/expertise/training-and-technical-assistance
last_touch: none
why_now: He sits in the same Urban Research to Action Lab and works on housing- and policy-adjacent questions.
hook: His role is close to the policy-and-systems-change and housing implementation lane.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best route to the right Urban staff member or project lead.
avoid: A generic Urban note without the housing and mobility overlap.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Martha Ross

contact: Martha Ross
relationship: cold metro-policy target; Vice President and Director of Brookings Metro
lane: lab-research
source_refs: https://www.brookings.edu/people/martha-ross/ ; https://www.brookings.edu/programs/brookings-metro/
last_touch: none
why_now: Brookings Metro covers workers, labor markets, and place-based inclusive growth.
hook: Her role owns the Metro program's policy and program direction.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Brookings Metro contact path or a short routing pointer.
avoid: A generic Brookings note that ignores the Metro program.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Adie Tomer

contact: Adie Tomer
relationship: cold infrastructure-policy target; Senior Fellow at Brookings Metro
lane: lab-research
source_refs: https://www.brookings.edu/people/adie-tomer/ ; https://www.brookings.edu/programs/brookings-metro/
last_touch: none
why_now: Brookings Metro ties infrastructure, transportation, and urban economics together.
hook: His role is a direct bridge into the Metro infrastructure-policy lane.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Brookings Metro contact path or a short collaboration pointer.
avoid: A generic Brookings note without the infrastructure framing.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Kelsi Coe

contact: Kelsi Coe
relationship: cold community-development target; Senior Program Officer, Health & Housing at LISC Indianapolis
lane: nonprofit-gov
source_refs: https://www.lisc.org/indianapolis/who-we-are/our-team/ ; https://www.lisc.org/indianapolis/what-we-do/health/ ; https://www.lisc.org/indianapolis/what-we-do/affordable-housing/
last_touch: none
why_now: LISC Indianapolis is actively working on health, affordable housing, and community development.
hook: She leads the Health & Housing portfolio and related partnership work.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best LISC Indianapolis contact path or a short collaboration pointer.
avoid: A generic LISC note without the Health & Housing angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Katie Grace Deane

contact: Katie Grace Deane
relationship: cold land-policy target; Chief Operating Officer at Lincoln Institute of Land Policy
lane: lab-research
source_refs: https://www.lincolninst.edu/about-lincoln-institute/people/katie-grace-deane/ ; https://www.lincolninst.edu/about-lincoln-institute/staff/
last_touch: none
why_now: Lincoln works across land policy, community investment, and implementation support.
hook: Her role owns the institute's operations and learning practice.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Lincoln contact path or a short routing pointer.
avoid: A generic Lincoln note without the land-policy operations frame.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06
## Wave 5 Named Contacts

### Andre M. Perry

contact: Andre M. Perry
relationship: cold community-wealth target; Senior Fellow and Director of the Center for Community Uplift at Brookings
lane: lab-research
source_refs: https://www.brookings.edu/people/andre-m-perry/ ; https://www.brookings.edu/programs/brookings-metro/ ; https://www.brookings.edu/books/black-power-scorecard/
last_touch: none
why_now: His Brookings work centers race, structural inequality, education, and economic inclusion.
hook: He leads the Center for Community Uplift and the Brookings community-wealth lane.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Brookings Metro contact path or a short routing pointer.
avoid: A generic Brookings note that skips the racial-wealth and community-uplift framing.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Robert Maxim

contact: Robert Maxim
relationship: cold place-based-policy target; Fellow at Brookings Metro
lane: lab-research
source_refs: https://www.brookings.edu/people/robert-maxim/ ; https://www.brookings.edu/programs/brookings-metro/
last_touch: none
why_now: His Brookings work focuses on how technology and economic change affect people and places.
hook: He works on place-based industrial policy and digital-employment questions.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Brookings Metro contact path or a short collaboration pointer.
avoid: A generic Brookings note without the place-based policy angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Tracy Hadden Loh

contact: Tracy Hadden Loh
relationship: cold infrastructure-and-land-use target; Fellow at Brookings Metro
lane: lab-research
source_refs: https://www.brookings.edu/people/tracy-hadden-loh/ ; https://www.brookings.edu/programs/brookings-metro/ ; https://www.brookings.edu/articles/tackling-the-paradox-of-underutilized-land-in-small-and-midsized-city-downtowns/
last_touch: none
why_now: Her Brookings work spans commercial real estate, infrastructure, racial justice, and governance.
hook: She sits at the intersection of land use, transportation, and public policy.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Brookings Metro contact path or a short collaboration pointer.
avoid: A generic Brookings note that misses the land-use and transportation overlap.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Robert Puentes

contact: Robert Puentes
relationship: cold land-policy leadership target; President and Chief Executive Officer at Lincoln Institute of Land Policy
lane: lab-research
source_refs: https://www.lincolninst.edu/about-lincoln-institute/staff/ ; https://www.lincolninst.edu/about-lincoln-institute/board-directors/ ; https://www.lincolninst.edu/land-wise/articles/robert-puentes-vp-director-brookings-metro-named-president-ceo-lincoln-institute-land-policy/
last_touch: none
why_now: Lincoln is a key land-policy institution, and Puentes now leads it.
hook: His background bridges land policy, infrastructure, housing, and regional planning.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best Lincoln Institute contact path or a short routing pointer.
avoid: A generic Lincoln note without the land-policy leadership angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

## Fresh Program Discovery

### MIT Solve

contact: MIT Solve
relationship: cold org-routing target; help desk / solver intake
lane: founder-ecosystem
source_refs: https://solve.mit.edu/contact ; https://solve.mit.edu/how-to-apply ; https://solve.mit.edu/innovators/become-a-solver ; https://solve.mit.edu/about/solve-team
last_touch: 2026-07-06
why_now: MIT Solve's help desk and solver pages are the right routing hub for a mission-aligned venture.
hook: The Solve help desk and solver pages are the best place to ask where a housing and infrastructure product fits.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask whether Homecastr belongs in a current challenge or partner path.
avoid: A generic MIT note without the Solve routing angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Harvard Innovation Labs

contact: Harvard Innovation Labs
relationship: cold org-routing target; i-lab contact and staff intake
lane: founder-ecosystem
source_refs: https://innovationlabs.harvard.edu/help-center/contact-us ; https://innovationlabs.harvard.edu/about/staff ; https://innovationlabs.harvard.edu/about/about-us
last_touch: 2026-07-06
why_now: The i-lab contact and staff pages can point to the right member, advisor, or office-hours path.
hook: The i-lab contact and staff pages are the best place to ask for the next routing step.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best next contact or office-hours path.
avoid: A generic Harvard note without the i-lab routing angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Cornelia Huellstrunk

contact: Cornelia Huellstrunk
relationship: cold program-routing target; Princeton Keller Center leader
lane: founder-ecosystem
source_refs: https://kellercenter.princeton.edu/people/leadership-staff ; https://kellercenter.princeton.edu/opportunities ; https://kellercenter.princeton.edu/princeton-entrepreneurial-hub
last_touch: 2026-07-06
why_now: The Keller Center's entrepreneurship and hub pages are the right Princeton routing path.
hook: Her Keller Center role is the best place to ask for the right person or program path.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best person or program path.
avoid: A broad Princeton note without the Keller Center angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Kassie Tucker

contact: Kassie Tucker
relationship: cold program-routing target; Tsai CITY leader
lane: founder-ecosystem
source_refs: https://city.yale.edu/people/kassie-tucker ; https://city.yale.edu/programs/tsai-city-engage ; https://city.yale.edu/our-team
last_touch: 2026-07-06
why_now: Tsai CITY's team and Engage pages are the right Yale routing path for venture or business development.
hook: Her Tsai CITY role is the best place to ask for the venture or business-development path.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best path into the venture or business-development side.
avoid: A generic Yale note without the Tsai CITY angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Richard Andersson

contact: Richard Andersson
relationship: cold program-routing target; Yale Ventures leader
lane: founder-ecosystem
source_refs: https://ventures.yale.edu/node/1600 ; https://ventures.yale.edu/yale-technologies/get-in-touch ; https://ventures.yale.edu/about/our-team
last_touch: 2026-07-06
why_now: Yale Ventures' get-in-touch and team pages are the right business-development routing path.
hook: His Yale Ventures role is the best place to ask which Yale innovation lane fits.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask which Yale innovation lane is the best fit.
avoid: A broad Yale note without the Ventures routing angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Vincent Reina

contact: Vincent Reina
relationship: cold program-routing target; Housing Initiative at Penn lead
lane: lab-research
source_refs: https://www.design.upenn.edu/people/vincent-reina ; https://www.design.upenn.edu/work/housing-initiative-penn-hip ; https://www.design.upenn.edu/city-regional-planning
last_touch: 2026-07-06
why_now: The Housing Initiative at Penn is a direct housing-policy bridge for a short collaboration or routing pointer.
hook: His Housing Initiative at Penn role is the best place to ask for a brief collaboration or routing pointer.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for a brief collaboration or routing pointer.
avoid: A generic Penn note without the housing-initiative angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Amanda Lloyd

contact: Amanda Lloyd
relationship: cold program-routing target; Penn IUR leader
lane: lab-research
source_refs: https://penniur.upenn.edu/people/amanda-lloyd ; https://penniur.upenn.edu/about ; https://research.upenn.edu/research-at-penn/centers-institutes/penn-institute-for-urban-research/
last_touch: 2026-07-06
why_now: Penn IUR's profile and about pages are the right urban-research routing path.
hook: Her Penn IUR role is the best place to ask for the right contact path.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the right Penn IUR contact path.
avoid: A broad Penn note without the urban-research angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### UChicago Urban Labs

contact: UChicago Urban Labs
relationship: cold program-routing target; contact page plus lab network
lane: lab-research
source_refs: https://urbanlabs.uchicago.edu/contact ; https://urbanlabs.uchicago.edu/people?labs=inclusiveeconomy ; https://educationlab.uchicago.edu/contact/ ; https://crimelab.uchicago.edu/contact/
last_touch: 2026-07-06
why_now: The Urban Labs contact page and lab contact pages are the right routing path into the network.
hook: The lab and contact pages are the best place to ask which staff member is the best fit.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask which lab or staff member is the best fit.
avoid: A generic Chicago note without the lab-network angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Lori Fernald Khamala

contact: Lori Fernald Khamala
relationship: cold program-routing target; Code the Dream contact
lane: nonprofit-gov
source_refs: https://codethedream.org/people/lori-fernald-khamala/ ; https://codethedream.org/apply/ ; https://codethedream.org/info-session/ ; https://codethedream.org/apprenticeship-requirements/ ; https://codethedream.org/ctd-labs/
last_touch: 2026-07-06
why_now: The apply, info-session, apprenticeship, and CTD Labs pages are the right adult code-school and partnership routes.
hook: Her Code the Dream role is the best place to ask whether admissions, partnerships, or CTD Labs is the right route.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask whether the best route is admissions, partnerships, or CTD Labs.
avoid: A generic CTD note without the apprenticeship and labs angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### The Knowledge House

contact: The Knowledge House
relationship: cold program-routing target; innovation fellowship and partnership intake
lane: nonprofit-gov
source_refs: https://www.theknowledgehouse.org/innovation_fellowship/ ; https://www.theknowledgehouse.org/get-involved/ ; https://www.theknowledgehouse.org/team_and_supporters/ ; https://www.theknowledgehouse.org/
last_touch: 2026-07-06
why_now: The Innovation Fellowship and get-involved pages are the right mission-aligned partnership route.
hook: The Knowledge House fellowship and get-involved pages are the best place to ask for the right contact path.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best contact path.
avoid: A generic TKH note without the fellowship and partnership angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

## Stanford / NYC housing discovery

### Stanford Impact Labs

contact: Stanford Impact Labs
relationship: cold program-routing target; university-wide impact-lab initiative
lane: lab-research
source_refs: https://impact.stanford.edu/contact-us ; https://impact.stanford.edu/about/people ; https://impact.stanford.edu/programs/phd-fellowship-0
last_touch: 2026-07-06
why_now: Stanford Impact Labs' contact and program pages are the right routing path for an impact-lab / partnership note.
hook: Its university-wide impact-lab mandate is the best place to ask where Homecastr fits.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask whether Homecastr belongs in a current impact-lab or partnership path.
avoid: A broad Stanford note without the impact-labs route.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: not checked in this session

### Columbia housing / urban planning labs

contact: Columbia housing / urban planning labs
relationship: cold Columbia housing-lab routing target; GSAPP Housing Lab / alumni intake
lane: lab-research
source_refs: https://www.arch.columbia.edu/research/labs/15-housing-lab ; https://www.arch.columbia.edu/contact ; https://magazine.columbia.edu/article/housing-gets-boost
last_touch:
why_now: The GSAPP Housing Lab is active and invites alums and professionals to reach out through the published contact path.
hook: Its action-oriented housing work is the closest Columbia bridge for a housing / infrastructure project.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best faculty or student-support routing for a short conversation.
avoid: A generic Columbia note without the housing-lab and urban-planning angle.
status: ready to send
next_followup: First follow-up after send.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-07

### Cornell Tech housing / urban tech labs

contact: Cornell Tech housing / urban tech labs
relationship: cold Cornell Tech urban-tech routing target; Urban Tech Hub / Urban Innovation Fellows intake
lane: lab-research
source_refs: https://urban.tech.cornell.edu/get-in-touch/ ; https://urban.tech.cornell.edu/urban-innovation-fellows/ ; https://tech.cornell.edu/impact/urban-tech-hub/
last_touch:
why_now: Cornell Tech's Urban Tech Hub is actively working on city-systems, partnerships, and responsible technology.
hook: Its urban-tech and urban-innovation work is the right bridge for a housing and infrastructure project.
proof_point: Homecastr's housing / infrastructure decision-support stack and my long-running disaster-resilience modeling work.
ask: Ask for the best faculty, lab, or program contact for a short conversation.
avoid: A generic Cornell note that skips the urban-tech and city-systems angle.
status: ready to send
next_followup: First follow-up after send.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-07

### Harvard

contact: Harvard
relationship: cold Harvard policy-lab routing target; Government Performance Lab intake
lane: lab-research
source_refs: https://govlab.hks.harvard.edu/contact-us/ ; https://govlab.hks.harvard.edu/working-at-gpl/ ; https://www.hks.harvard.edu/more/contact-us
last_touch:
why_now: Harvard's Government Performance Lab offers a direct policy and service-delivery bridge for housing and infrastructure work.
hook: The GovLab general inquiries path is a good fit for a housing / data / policy routing question.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask for the best policy or data contact path for a short conversation.
avoid: A generic Harvard note that ignores the policy-lab bridge.
status: ready to send
next_followup: First follow-up after send.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-07

### Public Policy Lab

contact: Public Policy Lab
relationship: cold public-policy routing target; design-and-service policy nonprofit
lane: nonprofit-gov
source_refs: https://www.publicpolicylab.org/connect/ ; https://www.publicpolicylab.org/
last_touch: 2026-07-06
why_now: Public Policy Lab's housing and service-design work is a strong fit for a routing question.
hook: Their housing and policy design projects make them a strong partnership target.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask whether there is a partnership path for a housing data / decision-support product.
avoid: A generic nonprofit note without the policy-design angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: not checked in this session

### NYC Housing Partnership

contact: NYC Housing Partnership
relationship: cold housing-program routing target; affordable-housing agency
lane: nonprofit-gov
source_refs: https://www.housingpartnership.com/contact ; https://www.housingpartnership.com/about/members/nyc-housing-partnership
last_touch: 2026-07-06
why_now: The partnership works on creating and preserving affordable housing across NYC.
hook: Their affordable-housing work makes them a good place to ask about a partnership or program path.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask whether there is a partnership or program path for a housing data / decision-support product.
avoid: A generic housing note without the partnership and development angle.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: not checked in this session

### NYU Health x Housing Lab

contact: Health x Housing Lab
relationship: cold lab-routing target; NYU Langone health-and-housing lab
lane: lab-research
source_refs: https://med.nyu.edu/departments-institutes/population-health/divisions-sections-centers/health-behavior/community-service-plan/all-programs/health-x-housing-lab ; https://med.nyu.edu/departments-institutes/population-health/divisions-sections-centers/health-behavior/community-service-plan/all-programs/health-x-housing-lab/our-team ; https://med.nyu.edu/departments-institutes/population-health/divisions-sections-centers/health-behavior/community-service-plan/all-programs/health-x-housing-lab/research
last_touch: 2026-07-06
why_now: The lab's health-and-housing focus makes it a strong collaboration target.
hook: Their health-and-housing focus makes them a strong collaboration target.
proof_point: Homecastr's housing / infrastructure decision-support stack and production forecasting.
ask: Ask whether there is a partnership or collaboration path that makes sense.
avoid: A broad NYU note that ignores the health-and-housing focus.
status: sent
action_state: sent
next_followup: 2026-07-13
spc_affiliation: not checked in this session

### Per Scholas

contact: Per Scholas
relationship: cold nonprofit / workforce-routing target; employer-partnership and volunteer intake
lane: nonprofit-gov
source_refs: https://enterprise.perscholas.org/ ; https://perscholas.org/locations/new-york/ ; https://perscholas.org/partnership-opportunities/ ; https://perscholas.org/about-per-scholas/partners-supporters/
last_touch:
why_now: Per Scholas is actively recruiting employer partners and offers explicit partnership, hiring, volunteer, and investment paths.
hook: The NYC location and partnership pages make it a strong route for mission-aligned talent, mentorship, or hiring.
proof_point: Homecastr is a housing and infrastructure decision-support product with production ML and validation discipline.
ask: Ask for the best contact path on the employer-partnership or volunteer side.
avoid: Leading with a full job pitch or asking admissions to route a business partnership.
status: sent
last_touch: 2026-07-07
next_followup: 2026-07-14
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-07

### Built In NYC

contact: Built In NYC
relationship: cold ecosystem-routing target; NYC hub support and community route
lane: founder-ecosystem
source_refs: https://builtin.com/awards/new-york-city/current/best-places-to-work ; https://builtin.com/articles ; https://knowledgebase.builtin.com/s/contactsupport ; https://knowledgebase.builtin.com/s/article/Industry-List ; https://employers.builtin.com/best-places-to-work/how-to-be-considered/
last_touch:
why_now: Built In keeps an active NYC hub plus public support routes, which makes it a plausible bridge to the right community or editorial contact.
hook: The NYC hub and employer-brand ecosystem are a clean bridge for a short founder note.
proof_point: Homecastr combines housing and infrastructure decision support with production ML and forecasting.
ask: Ask who on the NYC team handles community, editorial, or partnerships.
avoid: Treating support as a product bug report or overexplaining the founder story.
status: sent
last_touch: 2026-07-07
next_followup: 2026-07-14
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-07

### NYC Resilient Acquisitions

contact: NYC Resilient Acquisitions
relationship: cold public-sector routing target; housing recovery and resilience intake
lane: nonprofit-gov
source_refs: https://www.nyc.gov/site/housingrecovery/preparedness/resilient-acquisitions.page ; https://www.nyc.gov/content/climate/pages/initiatives/resilient-acquisitions ; https://www.nyc.gov/assets/hpd/downloads/pdfs/services/presentation-resilient-acquisitions-JS-residents.pdf
last_touch:
why_now: NYC currently runs active resilient-acquisition and housing-recovery programs that explicitly invite contact.
hook: The city's housing-recovery and resilience programs are close to Homecastr's policy and infrastructure work.
proof_point: Homecastr is a housing and infrastructure decision-support product with production ML and scenario analysis.
ask: Ask which office or program is the best route for a short collaboration or routing question.
avoid: A broad pitch that assumes the wrong agency owns the lane.
status: sent
last_touch: 2026-07-07
next_followup: 2026-07-14
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-07

### MOPD DRRN

contact: MOPD DRRN
relationship: cold public-sector routing target; cross-agency disaster-resilience network
lane: nonprofit-gov
source_refs: https://www.nyc.gov/site/mopd/resources/mopd-disaster-resilience-and-resource-network.page ; https://www.nyc.gov/content/climate/pages/initiatives/resilient-acquisitions ; https://www.nyc.gov/site/housingrecovery/preparedness/resilient-acquisitions.page
last_touch:
why_now: The Disaster Resilience and Resource Network is an explicit city route for recovery and resiliency outreach.
hook: The cross-agency resilience network is a plausible bridge for a housing and infrastructure product.
proof_point: Homecastr is a housing and infrastructure decision-support product with production ML and forecasting.
ask: Ask whether the DRRN or recovery office is the better starting point for a short conversation.
avoid: Turning it into a generic government blast or implying a procurement ask.
status: sent
last_touch: 2026-07-07
next_followup: 2026-07-14
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-07
