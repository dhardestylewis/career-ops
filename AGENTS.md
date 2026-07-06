# Career-Ops for Codex

Read `CLAUDE.md` for all project instructions, routing, and behavioral rules. They apply equally to Codex.

Key points:
- The canonical resume attachment is the tracked repo asset at:
  `data/assets/resume-dhl-20260630-causal-mle.pdf`
- Do not fall back to older PDFs unless the user explicitly says the resume changed.
- Reuse the existing modes, scripts, templates, and tracker flow - do not create parallel logic.
- Prefer safe durable action over narration. If a change can be made safely in the repo, make it and record it instead of only describing the next step.
- Store user-specific customization in `config/profile.yml`, `modes/_profile.md`, or `article-digest.md` - never in `modes/_shared.md`.
- For outreach, do not send until the contact dossier is complete and source-backed; prefer public-work hooks for professors and former instructors.
- Before sending outreach, check the recipient's current LinkedIn profile or organization page. If they moved, rewrite the note as a reconnect or current-role note, not an active-role follow-up.
- Before any outreach about work, money, gigs, contracts, or jobs, check the recipient against the South Park Commons pando member directory and South Park Commons Slack. If they are SPC-affiliated or the check is unclear, do not use a work pitch; switch to a non-work reconnect or mark the contact blocked for that lane.
- Login state is not permanent across fresh sessions. If Chrome already has authenticated LinkedIn, Pando, or Superhuman tabs open, keep those tabs alive and use the Chrome profile first; use the in-app browser only as a backup Gmail surface.
- You are explicitly authorized to auto-submit applications on the user's behalf when fill rate is 100%. Before submitting, ensure you capture a full-page screenshot and save the JSON payload to the archive DB.

For Codex-specific setup, see `docs/CODEX.md`.
