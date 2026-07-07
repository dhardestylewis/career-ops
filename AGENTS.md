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
- Before any outreach about work, money, gigs, contracts, or jobs, check the recipient against the South Park Commons pando member directory first. If the PDF/export gives a clean no-match and the contact is not SPC-adjacent, that is enough to proceed; use Slack only as a tie-breaker when the directory result is ambiguous, OCR-noisy, or the contact looks SPC-affiliated. If the check is still unclear, switch to a non-work reconnect or mark the contact blocked for that lane.
- For every LinkedIn DM, connection note, or invite note, never send from an already-open conversation unless it is the exact requested recipient. Verify the recipient in two independent UI signals before typing and again before sending, and treat missing `Pending` or send confirmation as unsent.
- Treat every path under `data/outreach/` as local-only working state. Do not stage or commit those files in a PR; if you need shareable examples, use `examples/` with redacted fixture data instead.
- Login state is not permanent across fresh sessions. If Chrome already has authenticated LinkedIn, Pando, or Superhuman tabs open, keep those tabs alive and use the Chrome profile first; use the in-app browser only as a backup Gmail surface.
- You are explicitly authorized to auto-submit applications on the user's behalf when fill rate is 100%. Before submitting, ensure you capture a full-page screenshot and save the JSON payload to the archive DB.

For Codex-specific setup, see `docs/CODEX.md`.
