---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
user_invocable: true
args: mode
---

# career-ops -- Router

## Mode Routing

Determine the mode from `{{mode}}`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | `auto-pipeline` |
| `oferta` | `oferta` |
| `ofertas` | `ofertas` |
| `contacto` | `contacto` |
| `deep` | `deep` |
| `pdf` | `pdf` |
| `training` | `training` |
| `project` | `project` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `apply` | `apply` |
| `scan` | `scan` |
| `batch` | `batch` |
| `followup` | `followup` |
| `patterns` | `patterns` |
| `interview-prep` | `interview-prep` |

**Auto-pipeline detection:** If `{{mode}}` is not a known sub-command and contains JD text or a URL to a JD, execute `auto-pipeline`. If it is not a sub-command and does not look like a JD, show discovery.

## Discovery Mode

Show the command center menu:

```text
career-ops -- Command Center

Available commands:
  /career-ops {JD}      → AUTO-PIPELINE: evaluate + report + PDF + tracker
  /career-ops pipeline  → Process pending URLs from inbox
  /career-ops oferta    → Evaluation only A-F (no auto PDF)
  /career-ops ofertas   → Compare and rank multiple offers
  /career-ops contacto  → LinkedIn power move: find contacts + draft message
  /career-ops deep      → Deep research prompt about company
  /career-ops pdf       → PDF only, ATS-optimized CV
  /career-ops training  → Evaluate course/cert against North Star
  /career-ops project   → Evaluate portfolio project idea
  /career-ops tracker   → Application status overview
  /career-ops apply     → Live application assistant
  /career-ops scan      → Scan portals and discover new offers
  /career-ops batch     → Batch processing with parallel workers
  /career-ops followup  → Update and calculate follow-ups
  /career-ops patterns  → Analyze rejection patterns
  /career-ops interview-prep → Build interview prep from a report or role

Inbox: add URLs to data/pipeline.md → /career-ops pipeline
Or paste a JD directly to run the full pipeline.
```

## Context Loading by Mode

Load `modes/_shared.md` plus the mode file for:

- `auto-pipeline`
- `oferta`
- `ofertas`
- `pdf`
- `contacto`
- `apply`
- `pipeline`
- `scan`
- `batch`
- `followup`
- `patterns`

Load only the mode file for:

- `tracker`
- `deep`
- `training`
- `project`
- `interview-prep`

For modes that need an agent handoff, inject the loaded context and the invocation-specific data into the subagent prompt.
