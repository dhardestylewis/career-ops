# Outreach Funnel Summary

Date: 2026-07-13

This is the cross-lane tabulation for outreach in this workspace. It pulls together the career, GTM, and VC / investor reads so the lanes do not get blended by accident.

## Cross-Lane Table

| Funnel / lane | Source of truth | What is logged | What is working | Main bottleneck |
|---|---|---|---|---|
| Career role-seeking | `data/outreach/outcome-backfill.md` | 27 role-seeking touches inside 103 career ledger rows / 101 actual outreach touches; no confirmed held meetings or contact-level interviews logged | Recruiter bridges, hiring-manager notes, and warm routing | Reply -> booked meeting -> held meeting -> interview capture |
| Career academic | `data/outreach/outcome-backfill.md` | 4 email touches | Direct academic reconnects | Small sample; keep it source-backed |
| Career community | `data/outreach/outcome-backfill.md` | 23 touches, mostly Slack | Relationship maintenance and compare-notes | Not a job-search conversion channel |
| Career reconnect / follow-up | `data/outreach/outcome-backfill.md` | 32 reconnect touches plus 15 post-application follow-ups | Warm reconnects and current-thread replies | Convert reply into an explicit next step |
| GTM lead / customer / partner / advisor | `data/gtm-outreach/outcome-backfill.md` | 146 ledger rows; 131 sends, 7 replies, 3 pending, 5 blocked; 0 confirmed held discovery calls | Email-led compare-notes and routing replies | Reply -> booked discovery -> held discovery |
| VC / investor / fundraising | `docs/homecastr-vc-agent-handoff.md` | Separate lane; no unified ledger in this snapshot | One ask: feedback, fit, or a call | Needs its own tracking and should not be folded into GTM |

## What Is Most Effective

- Short, specific, one-ask messages.
- Warm routing and current-role reconnects.
- Email for GTM and academic follow-ups.
- Slack only for community compare-notes.
- Counting booked and held meetings separately instead of collapsing them.

## Raw Ledger Shape

These are the raw event kinds in the restored ledgers. They are useful for workflow coverage, but they are not the same thing as outcome stages like held meetings or interviews.

| Lane | Total rows | Send | Reply | Pending | Blocked | Verification | Note |
|---|---:|---:|---:|---:|---:|---:|---|
| Career | 103 | 81 | 8 | 12 | 1 | 1 | 101 actual outreach touches after excluding the blocked row and internal verification row. |
| GTM | 146 | 131 | 7 | 3 | 5 | 0 | Email dominates; LinkedIn is mostly routing / verification. |

## What To Fix First

1. Capture held meetings separately from bookings.
2. Log first meeting, second meeting, interview 1, interview 2, final round, and offer explicitly.
3. Keep investor / fundraising out of the GTM funnel.
4. Keep Slack out of role-seeking outreach.
5. Use the smallest viable ask and stop as soon as the next step is clear.

## Coverage Gaps

- The career-side ledger, drafts, send-list, and roadmap now exist only as local working state. They are intentionally not part of the PR history.
- Career held meetings and interview rounds are still conservative counts because the source material does not store them as first-class fields everywhere.
- GTM held discovery calls are also conservative for the same reason.
- VC / fundraising still needs its own dedicated ledger if you want the same stage-by-stage reporting there.
- `career-search` remains a mixed label and must be split into lanes before any totals are treated as meaningful.
