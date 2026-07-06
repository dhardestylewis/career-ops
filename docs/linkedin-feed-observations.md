# LinkedIn Feed Observations

This note captures the working context from the current LinkedIn feed sampling session so future agents can pick up the same thread without rereading the full browser interaction.

## What We Learned

- The live LinkedIn feed can be sampled in the in-app browser without a full refresh.
- Use the exact `Load more` control on the feed page; it revealed additional items cleanly.
- Signal quality degrades as more of the feed is loaded because the sample starts to fill with general posts, promoted content, and news.
- A practical monitoring cadence is every `1-3` days if you want fresh opportunities.
- For rough classification, `30` opportunity posts is a reasonable minimum sample; `50` is better.

## Sample Summary

- Loaded sample size: `138` feed posts.
- Opportunity-style posts found: `26`.
- Direct-contact style posts: `3` direct, `3` both direct and portal.
- Portal-style posts: `12` portal, `3` both direct and portal.
- Ambiguous posts: `8`.

## Canonical Table

The full row-by-row table now lives in [data/state/linkedin-feed-observations.tsv](../data/state/linkedin-feed-observations.tsv). Use that TSV as the source of truth for sorting, filtering, and future follow-up.

The TSV includes:

- `sample_order`
- `captured_at`
- `person_org`
- `what_it_looks_like`
- `path`
- `fit_against_resume_interview_history`
- `evidence_source`
- `follow_up`
- `source_post_url`
- `linkedin_profile_url`
- `contact_email`
- `contact_phone`
- `application_url`
- `job_url`
- `jd_url`
- `notes`
- `raw_excerpt`

Companion contact fields that were visible in the feed text live in [data/state/linkedin-feed-contacts.tsv](../data/state/linkedin-feed-contacts.tsv).

Use the fit column as a real evidence check, not a guess:

- `High` means the role lines up with the CV and the visible post content.
- `Medium` means the role is adjacent and worth a human check before investing time.
- `Low` means the post is interesting but the fit is weak or the signal is mostly networking.
- `Unknown` means we need to inspect resume, email threads, DM history, or interview notes before assigning a fit.

Good evidence sources, in order:

1. Resume and proof points in `data/cv.md` and `article-digest.md`.
2. Past interview feedback and recruiter responses.
3. Email replies and LinkedIn DMs that show interest, rejection, or request for more detail.
4. The post text itself, if nothing else exists.

## Contact Forms Seen

The direct path was usually one of:

- `DM me`
- `send me a DM`
- `contact me`
- `reach out`

In the loaded sample, no clear email address or phone number was visible in the opportunity posts we classified as direct-contact.

## How To Reuse This

If you continue sampling later:

1. Stay on the feed tab.
2. Click the exact `Load more` control.
3. Recount only the newly loaded opportunity posts.
4. Treat ambiguous posts cautiously; several of them turned out to be false positives once read more closely.

## Current Working Rule

If the question is "should we keep going?", the answer is:

- `No` for a quick directional read after about `12` opportunity posts.
- `Yes` for a more defensible split until at least `30` opportunity posts.
- `Maybe continue` only if you specifically want a tighter portal-vs-direct ratio.

## Outreach Handoff

The next agent should treat this feed sample as a lead list, not as a reason to bulk-send.

Before sending anything:

0. Read `docs/outreach-guardrails.md`.
1. Check `data/outreach-template-evidence.md` for the current template library and the evidence behind each template choice.
2. Run `npm run outreach:audit -- "Recipient Name"` so you do not duplicate an already-sent recipient or miss an existing thread.
3. Keep messages to one specific hook, one proof point, and one small ask.
4. For founder-style intros, lead with the bridge first and keep the bio short.
5. For broader cold outreach, make the ask smaller than you think it should be.

The worktree is ready to draft and send one contact at a time, but it should preserve a paper trail:

- draft text
- channel used
- recipient
- template id
- outcome
