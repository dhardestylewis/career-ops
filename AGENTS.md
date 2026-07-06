# Career-Ops for Codex

Read `CLAUDE.md` for all project instructions, routing, and behavioral rules. They apply equally to Codex.

Key points:
- The canonical resume attachment is fixed in `config/profile.yml` at:
  `C:\Users\dhl\data\Portfolio\cv-dhl.git\resume\2-page\without-cover-letter\resume-dhl-20260630-causal-mle\resume-dhl-20260630-causal-mle.pdf`
- Do not fall back to older PDFs unless the user explicitly says the resume changed.
- Reuse the existing modes, scripts, templates, and tracker flow - do not create parallel logic.
- Store user-specific customization in `config/profile.yml`, `modes/_profile.md`, or `article-digest.md` - never in `modes/_shared.md`.
- You are explicitly authorized to auto-submit applications on the user's behalf when fill rate is 100%. Before submitting, ensure you capture a full-page screenshot and save the JSON payload to the archive DB.

For Codex-specific setup, see `docs/CODEX.md`.
