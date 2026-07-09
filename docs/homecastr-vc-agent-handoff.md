# Homecastr VC Agent Handoff

Date: 2026-07-08

Use this when career-ops agents need to coordinate with Homecastr VC, investor, SPC-suppression, or founder-copy work in `C:\Users\dhl\data\Projects\Properlytic_UI\v0-properlytic-8v`.

## Lane Separation

- Keep candidate-seeking, Homecastr hiring-source outreach, GTM outreach, and VC/investor outreach in separate lanes.
- Candidate-seeking messages ask for a role, interview path, or job-routing help only.
- Homecastr hiring-source messages ask for talent, intros, or sourcing help only.
- VC/investor messages ask for investor feedback, fit, or a call only.
- Never combine candidate asks with Homecastr investor, hiring, talent, or sourcing asks in the same message, thread, or packet unless the recipient explicitly opens both lanes.

## SPC Suppression

- For any work, money, gigs, contracts, jobs, hiring, or investor outreach, check South Park Commons affiliation first.
- If a contact is SPC-affiliated or unclear, do not use a work/investor pitch. Mark the lane blocked or switch to a non-work reconnect.
- Homecastr VC outreach uses the SPC suppression files and helpers in the product repo; do not bypass them from career-ops.

## Homecastr VC Copy

Preferred first-touch framing:

```text
Homecastr is building the built-environment world model: a foundation model for physical development that turns public records and open data into digital twin-style scenario planning across parcels, buildings, infrastructure, utilities, and energy.
The whitespace is that most tabular and time-series foundation model labs are not using that public-records surface as their primary benchmark and training input.
We're already live across 50M+ parcel observations, handling roughly 14M requests per week in production, and published backtests show about 7% one-year-ahead median error with useful multi-year calibration.
If this is relevant, would you be open to a quick call next week?
```

## Copy Rules

- Use `built-environment world model` or `foundation model for physical development` for technical investor contexts.
- Tie `digital twin` and `scenario planning` to parcels, buildings, infrastructure, utilities, and energy.
- Emphasize public records and open data as the primary benchmark and training surface.
- Default investor proof line: `50M+ parcel observations`, `14M requests per week in production`, and `~7% one-year-ahead median error`.
- Do not drift back to `Houston pilot`, `1M+ properties`, or `1M+ parcels` unless explicitly requested.
- Do not lead with a deck, valuation, or round mechanics in written cold outreach.
- Keep the ask to one call request.

## Product Repo Source Of Truth

Before acting, read these files in `C:\Users\dhl\data\Projects\Properlytic_UI\v0-properlytic-8v`:

- `AGENTS.md`
- `docs/AGENTS.md`
- `docs/vc-pr-agent-handoff.md`
- `docs/vc-outreach-handover.md`
- `docs/vc-follow-up-next-steps-2026-07-08.md`
- `packages/research/pitch/copy.md`
- `packages/pipeline/scripts/outreach/utils/spc_suppression.py`
- `packages/pipeline/scripts/outreach/utils/follow_up_cadence.py`

## Stop Conditions

Pause if:

- routing is unclear
- the recipient is already contacted
- SPC status is unclear
- the copy sounds like candidate outreach, hiring-source outreach, or media outreach
- the next step would be deck-first
- there is no clear relevance match
- the user has not approved live sends
