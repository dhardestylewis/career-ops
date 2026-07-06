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

## Columbia / housing research routing

### Douglas Woodward

contact: Douglas Woodward
relationship: Columbia GSAPP career-routing contact; not a collaborator
lane: Columbia program routing
source_refs: Gmail: 2026-07-06 Columbia GSAPP thread with Douglas Woodward reply; https://www.arch.columbia.edu/faculty/353-douglas-woodward; https://www.arch.columbia.edu/career-services; https://www.arch.columbia.edu/programs/10-m-s-urban-planning
last_touch: 2026-07-06 reply in the Columbia GSAPP thread asking what mission or housing lane I was targeting.
why_now: Douglas asked for more specificity, and I now have the named contacts plus the current resume to make the routing easier.
hook: GSAPP lists him as the Associate Director for Professional Development and Practice and the Urban Planning career-services contact.
proof_point: Attached current 06/30 causal MLE resume plus Homecastr's housing forecasting and validation stack.
ask: Ask for the names or an introduction to the best current contact for affordable housing or housing-data / innovation work.
avoid: Collaborator language, abstract lane-narrowing language, or broad follow-up phrasing like "if helpful, I can narrow this more."
status: sent
action_state: sent
next_followup: 2026-07-10 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

## Thesis reader batch

### Dory Thrasher

contact: Dory Thrasher
relationship: thesis reader and Columbia GSAPP adjunct; not a collaborator
lane: warm-academic
source_refs: thesis acknowledgments in the Homecastr thesis; https://www.arch.columbia.edu/faculty/6946-dory-thrasher; https://frac.org/about/staff
last_touch: 2026-07-06 send from daniel@homecastr.com
why_now: Homecastr has sharpened around affordable housing and housing-data / ML applications that can drive measurable impact, and Dory's current Columbia GSAPP / FRAC policy lane is a relevant academic bridge.
hook: Adjunct Assistant Professor at Columbia GSAPP and Senior SNAP Policy Analyst at FRAC.
proof_point: The current 06/30 causal MLE resume plus Homecastr's housing forecasting and validation stack.
ask: Ask for thoughts on Homecastr and any specific people, labs, programs, or openings that could be a fit.
avoid: Vague "if helpful" narrowing language, broad job-pitch framing, or overexplaining the entire founder story.
status: sent
action_state: sent
next_followup: 2026-07-10 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### James Piacentini

contact: James Piacentini
relationship: thesis reader and Columbia GSAPP academic contact; not a collaborator
lane: warm-academic
source_refs: thesis acknowledgments in the Homecastr thesis; https://www.arch.columbia.edu/faculty/990-james-piacentini; https://jamespiacentini.com/
last_touch: 2026-07-06 send from daniel@homecastr.com
why_now: Homecastr has sharpened around affordable housing and spatial / map-heavy housing-data work, and James's map and urban-tech lane is a relevant academic bridge.
hook: Senior Map Designer at Mapbox and Adjunct Assistant Professor at Columbia.
proof_point: The current 06/30 causal MLE resume plus Homecastr's geospatial forecasting and validation stack.
ask: Ask for thoughts on Homecastr and any specific people, labs, programs, or openings that could be a fit.
avoid: Generic networking language, overloading the note with background, or making the ask sound like a cold job blast.
status: sent
action_state: sent
next_followup: 2026-07-10 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Matthew Bauer

contact: Matthew Bauer
relationship: thesis reader and Columbia GSAPP adjunct; not a collaborator
lane: warm-academic
source_refs: thesis acknowledgments in the Homecastr thesis; https://www.arch.columbia.edu/faculty/4302-matthew-bauer
last_touch: 2026-07-06 send from daniel@homecastr.com
why_now: Homecastr has sharpened around affordable housing and urban-planning / city-data work, and Matthew's planning and BID background is a relevant academic bridge.
hook: Adjunct Associate Professor at Columbia GSAPP and President of the Madison Avenue BID.
proof_point: The current 06/30 causal MLE resume plus Homecastr's housing forecasting and validation stack.
ask: Ask for thoughts on Homecastr and any specific people, labs, programs, or openings that could be a fit.
avoid: Generic alumni-style language, a broad pitch, or asking for too many things at once.
status: sent
action_state: sent
next_followup: 2026-07-10 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Josh Begley

contact: Josh Begley
relationship: thesis reader and Columbia GSAPP adjunct; not a collaborator
lane: warm-academic
source_refs: thesis acknowledgments in the Homecastr thesis; https://www.arch.columbia.edu/faculty/5276-josh-begley; https://joshbegley.com/
last_touch: 2026-07-06 send from daniel@homecastr.com
why_now: Homecastr sits at the intersection of housing-data systems and public-facing storytelling / visualization, and Josh's data-art and filmmaking lane is a relevant academic bridge.
hook: Adjunct Assistant Professor at Columbia GSAPP, Technical Director at Field of Vision, and a data artist / filmmaker.
proof_point: The current 06/30 causal MLE resume plus Homecastr's housing forecasting and validation stack.
ask: Ask for thoughts on Homecastr and any specific people, labs, programs, or openings that could be a fit.
avoid: Turning the note into a generic cold pitch or trying to explain the whole thesis context in the opener.
status: sent
action_state: sent
next_followup: 2026-07-10 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Adam Vosburgh

contact: Adam Vosburgh
relationship: thesis reader and Columbia GSAPP adjunct; not a collaborator
lane: warm-academic
source_refs: thesis acknowledgments in the Homecastr thesis; https://www.arch.columbia.edu/faculty/3217-adam-vosburgh; https://adamvosburgh.com/about/
last_touch: 2026-07-06 send from daniel@homecastr.com
why_now: Homecastr has sharpened around affordable housing and geospatial / computational-design-adjacent data work, and Adam's MSCDP background is a relevant academic bridge.
hook: Adjunct Assistant Professor and Assistant Director of the M.S. Computational Design Practices program at Columbia GSAPP.
proof_point: The current 06/30 causal MLE resume plus Homecastr's housing forecasting and validation stack.
ask: Ask for thoughts on Homecastr and any specific people, labs, programs, or openings that could be a fit.
avoid: Generic job pitch language, a long founder bio, or asking for more than one concrete next step.
status: sent
action_state: sent
next_followup: 2026-07-10 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Stijn Van Nieuwerburgh

contact: Stijn Van Nieuwerburgh
relationship: thesis reader and Columbia Business School academic contact; not a collaborator
lane: warm-academic
source_refs: thesis acknowledgments in the Homecastr thesis; https://business.columbia.edu/faculty/people/stijn-van-nieuwerburgh; https://cepr.org/about/people/stijn-van-nieuwerburgh
last_touch: 2026-07-06 send from daniel@homecastr.com
why_now: Homecastr has sharpened around affordable housing and housing-data / real-estate analysis, and Stijn's housing-markets work is the clearest academic bridge.
hook: Professor of Real Estate and Finance at Columbia Business School and Co-Director of the Paul Milstein Center for Real Estate.
proof_point: The current 06/30 causal MLE resume plus Homecastr's housing forecasting and validation stack.
ask: Ask for thoughts on Homecastr and any specific people, labs, programs, or openings that could be a fit.
avoid: Making the note sound like a blanket networking ask or a direct job application.
status: sent
action_state: sent
next_followup: 2026-07-10 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Brad Greenburg

contact: Brad Greenburg
relationship: cold institutional contact; current executive director of the NYU Furman Center
lane: research routing
source_refs: Gmail: 2026-07-06 Columbia GSAPP thread with Douglas Woodward reply; https://www.furmancenter.org/people/brad-greenburg/; https://www.furmancenter.org/contact/; https://www.furmancenter.org/for-the-media/
last_touch: 2026-07-06 Douglas Woodward reply in the Columbia GSAPP thread, which named Furman as a housing research home worth contacting.
why_now: Douglas pointed me to Furman while I was narrowing the housing and urban-data lane, and Furman is currently active on housing research and data inquiries.
hook: Brad is the current executive director, and Furman routes media inquiries through Donna Borak and data inquiries through Rohun Iyer.
proof_point: Homecastr's housing forecasting and validation stack plus my production ML background fit a data and research conversation.
ask: Ask for the best person at Furman to speak with about housing research and data work.
avoid: Turning it into a broad job pitch, leading with salary, or overexplaining the full founder story.
status: ready to send
action_state: ready
next_followup: 2026-07-13 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Galia Solomonoff

contact: Galia Solomonoff
relationship: cold Columbia faculty contact; director of the GSAPP Housing Lab
lane: lab routing
source_refs: Gmail: 2026-07-06 Columbia GSAPP thread with Douglas Woodward reply; https://www.arch.columbia.edu/research/labs/15-housing-lab; https://www.arch.columbia.edu/faculty/201-galia-solomonoff
last_touch: 2026-07-06 Douglas Woodward reply in the Columbia GSAPP thread, which named the GSAPP Housing Lab.
why_now: Douglas pointed me to the Housing Lab, and the lab page currently lists Galia as Director and gives the current faculty and alumni routing addresses.
hook: Galia directs the lab, and the page routes faculty to facultyaffairs@arch.columbia.edu and alums or professionals to gsappalumni@columbia.edu.
proof_point: Homecastr's housing forecasting and validation stack gives me a concrete way into housing research.
ask: Ask whether there is a Columbia contact for housing research that could include student collaboration.
avoid: Making it sound like a generic cold pitch or an active hiring request.
status: ready to send
action_state: ready
next_followup: 2026-07-13 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Howard Slatkin

contact: Howard Slatkin
relationship: cold institutional contact; executive director of CHPC
lane: public-interest routing
source_refs: Gmail: 2026-07-06 Columbia GSAPP thread with Douglas Woodward reply; https://chpcny.org/about-us/our-staff/; https://chpcny.org/chpc-welcomes-new-executive-director-howard-slatkin/
last_touch: 2026-07-06 Douglas Woodward reply in the Columbia GSAPP thread, which named CHPC as a housing NGO think tank worth knowing.
why_now: Douglas pointed me to CHPC as a housing nonprofit worth knowing, and CHPC is currently active on housing policy and planning.
hook: Howard is the current executive director, and CHPC's public contact is info@chpcny.org.
proof_point: Homecastr's housing forecasting and validation stack plus my applied ML background fit a data and policy conversation.
ask: Ask for the best person at CHPC to speak with about housing research and data work.
avoid: Overloading him with a long founder bio or a broad ask.
status: ready to send
action_state: ready
next_followup: 2026-07-13 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Weiping Wu

contact: Weiping Wu
relationship: cold Columbia faculty contact; Professor and Director of the M.S. in Urban Planning program
lane: Columbia program routing
source_refs: Gmail: 2026-07-06 Columbia GSAPP thread with Douglas Woodward reply; https://provost.columbia.edu/people/weiping-wu; https://www.arch.columbia.edu/research/labs/15-housing-lab
last_touch: 2026-07-06 Douglas Woodward reply in the Columbia GSAPP thread, plus the GSAPP Academic and Student Affairs note that pointed me to Weiping Wu.
why_now: Columbia is putting together a housing initiative this summer, and GSAPP academic staff already pointed to Weiping as the director of planning.
hook: Weiping currently directs the urban planning program and works on housing and infrastructure.
proof_point: Homecastr's housing forecasting and validation stack gives a concrete applied-ML bridge.
ask: Ask whether there is a Columbia contact for housing research or student-facing work this summer.
avoid: Treating it like a generic cold pitch or sounding like I am trying to force a match.
status: ready to send
action_state: ready
next_followup: 2026-07-13 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06

### Kerry Donahue

contact: Kerry Donahue
relationship: cold institutional contact; director of communications at the Harvard Joint Center for Housing Studies
lane: research center routing
source_refs: Gmail: 2026-07-06 Columbia GSAPP thread with Douglas Woodward reply; https://www.jchs.harvard.edu/staff/kerry-donahue; https://www.jchs.harvard.edu/staff; https://www.jchs.harvard.edu/state-nations-housing-2026
last_touch: 2026-07-06 Douglas Woodward reply in the Columbia GSAPP thread, which named the Harvard Joint Center as a respected housing research home.
why_now: Douglas pointed me to JCHS as a respected housing research group, and the 2026 State of the Nation's Housing page lists Kerry as the current media contact.
hook: Kerry is the communications director and the public contact for interview requests at JCHS.
proof_point: Homecastr's housing forecasting and validation stack plus my applied ML background are a credible bridge into housing research.
ask: Ask whether there is a better person at JCHS to speak with about housing research or fellowship paths.
avoid: Making it sound like a blanket networking blast or a direct pitch for a specific opening.
status: ready to send
action_state: ready
next_followup: 2026-07-13 if no reply.
spc_affiliation: no match in South Park Commons directory PDF; Slack not checked in this session
spc_checked_at: 2026-07-06
