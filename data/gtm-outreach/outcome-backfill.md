# GTM Outreach Outcome Backfill

Derived from the GTM outreach ledger, GTM contact dossier, and current lead-state docs in this workspace.

This is a best-effort backfill of the outcome-style fields you asked about:
- `discovery_round` as the GTM analog of a first/second meeting
- `warm_handoff`
- `reply_outcome`

Important:
- The GTM ledger does not store held discovery calls as a first-class field.
- I only mark a row when the source text explicitly supports it.
- If the source only suggests a scheduled time or availability, I label that as a scheduling signal, not a confirmed meeting.

## Reorg Read

This GTM ledger is already a separate lane from `career-search`. Its cleanest split is:
- `email-led outreach`: the main outbound motion
- `LinkedIn routing`: connect notes and a small number of DM checks
- `reply-state`: explicit replies, handoffs, and availability signals

Channel read:

| Channel | Touches | Read |
| --- | ---: | --- |
| `email` | 138 | This is the dominant channel and the one that produced all explicit reply signals. |
| `linkedin-connect` | 7 | Mostly pending or blocked routing checks. |
| `linkedin-dm` | 1 | Used only as a blocked route check. |

## What The Source Supports

| Bucket | Count | What it means |
| --- | ---: | --- |
| Discovery / scheduling signals | 4 | The reply text contains explicit availability or meeting-time language, but not a confirmed held call. |
| Warm handoff / routing signals | 1 | The reply explicitly hands the thread to another owner. |
| Other reply signals | 3 | Real replies that are not clearly meetings or handoffs. |
| Confirmed held discovery calls | 0 | None are explicitly logged in the GTM ledger. |

## Contact-Level Backfill

| Contact | Company / lane | channel | discovery_round | warm_handoff | reply_outcome | Source signal |
| --- | --- | --- | --- | --- | --- | --- |
| Gordon Dolven | CBRE / broker-advisory | email | discovery_signal | none logged | availability_reply | Replied with `7/20-7/24 availability for CBRE market-dynamics call`; invite was deferred until he selected a slot. |
| Zachary Hansen | AJC / market-owner | email | discovery_signal | none logged | availability_reply | Replied with `Thursday 2pm ET`. |
| Marc Valenzuela | Salt River Project / economic development | email | discovery_signal | none logged | availability_reply | Replied with `Monday 3pm ET`. |
| Daniel Lusk | 3Dtrees / partner-adjacent | email | none logged | none logged | content_reply | Replied with `spatial forecasting / dataset offer`. |
| Eugenia Dushina | dat.ai / product-test thread | email | none logged | none logged | content_reply | Replied with `testing instructions`. |
| Emma Stevens | Data Center Coalition / community thread | email | none logged | none logged | content_reply | Replied with `membership decline`. |
| Andrew Jay | CBRE / routing thread | email | none logged | warm_handoff_to_Kevin_Restivo | routing_reply | Replied after pointing the thread to Kevin Restivo. |

## GTM Read

If you want the strict version:
- There are no confirmed held discovery calls logged here.
- There are no first/second discovery rounds stored as explicit state.
- Email is the most effective GTM channel in this ledger; LinkedIn mostly served as route verification or remained blocked.
- Investor or fundraising outreach should be read as its own VC lane, not folded into the customer / partner GTM counts.

If you want the useful version:
- The GTM ledger does show 4 scheduling/discovery signals.
- It shows 1 explicit warm handoff.
- It shows 3 other live replies that may be worth keeping warm, but they are not meeting-stage records.
- If the target is an investor, allocator, or fundraising advisor, route it to the VC handoff lane and keep the ask to feedback, fit, or a call.

## Overall Funnel Read

The GTM funnel is clearer than the career funnel, but it is still early-stage.

- Strongest motion: email. It is the dominant outbound channel and the one that produced all explicit reply signals.
- Weakest motion: discovery conversion. The ledger shows replies and scheduling hints, but no confirmed held discovery calls.
- Current shape: good list quality and decent response capture, but the motion is still mostly pre-call.
- Practical takeaway: the GTM side is generating traction, but the bottleneck is turning replies into actual booked conversations.
- If this is meant to function like a sales funnel, the biggest win will come from sharper scheduling follow-through and better capture of held calls.

## Ledger Totals

| Metric | Count |
| --- | ---: |
| Logged touches | 146 |
| Unique recipients | 138 |
| Email touches | 138 |
| LinkedIn connect touches | 7 |
| LinkedIn DM touches | 1 |
| Send events | 131 |
| Reply events | 7 |
| Pending events | 3 |
| Blocked events | 5 |
