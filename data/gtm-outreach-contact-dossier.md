# GTM Outreach Contact Dossier

Use this before any live send or follow-up. If you cannot fill it from actual source material, the action state is `research`, not `ready`.

Mandatory preflight:

```bash
npm run outreach:audit -- "Recipient Name"
```

If the audit finds an existing thread or prior send, do not open a fresh intro. Continue the existing thread or route to the right follow-up state.

## Required Questions

1. Who exactly is this person, and what is our relationship?
2. What was the last real touch, and when did it happen?
3. Why are we reaching out now?
4. What exact hook about them is specific enough to feel personal?
5. What exact proof point about us makes the ask credible?
6. What is the smallest sensible ask for this channel?
7. What should we avoid mentioning because it is stale, too much, or risky?
8. What is the send state and follow-up rule if they do not reply?

## Minimum Source Set

- CRM or inbox: latest thread, prior thread if it exists, exact subject lines, dates, asks, replies, commitments, intros, and attachments.
- LinkedIn: profile headline, current role, recent activity, DM history, mutual connections, and obvious role changes.
- Public web: 1 to 2 concrete artifacts only, such as a product page, release note, article, talk, case study, or announcement, with title and date.
- Internal context: one matching proof point from the deck, demo notes, customer notes, or product evidence that directly supports the ask.
- Before sending, verify the recipient's current company and role. If they moved, rewrite the note as a reconnect or current-role note.

## Lead State Model

| State | Minimum evidence | Stop condition / next step |
|---|---|---|
| `research` | You cannot yet fill the required questions from actual source material. | Keep gathering sources; do not draft or send. |
| `blocked` | The contact path is blocked, the conflict check is unclear, or the user said no contact. | Do not send the pitch; use only a reconnect or stop. |
| `draft` | The source-backed fields are mostly filled, but the wording or routing still needs refinement. | Continue drafting only; do not send yet. |
| `ready` | `why_now`, `hook`, `proof_point`, and `ask` are all source-backed. | Send only after the send gate clears. |
| `sent` | The message was sent and logged. | Move to waiting. |
| `waiting` | The send went out and a follow-up date is set. | Follow the cadence only; do not re-pitch. |
| `replied` | A response arrived. | Answer directly or pause for human judgment. |
| `no-contact` | The user explicitly said no contact or watch only. | Do not revisit unless the instruction changes. |

## Conflict Check

Before any pitch about revenue, partnerships, or buying conversations, check whether the recipient is:

- An active customer
- An existing partner
- A current competitor
- The wrong owner for the account

If the check is unclear, use a reconnect or routing note instead of a hard pitch.

## Annotation Schema

```text
lead:
company:
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
owner:
lead_type:
lead_score:
conflict_check:
conflict_checked_at:
```

## Send / No-Send Gate

- Send only if `action_state` is `ready` and `why_now`, `hook`, `proof_point`, and `ask` are filled from sources.
- Do not send if the hook is generic, the relationship is unclear, or the last touch is unknown.
- For warm contacts, require at least one prior thread or shared history plus one current reason to reach out.
- For cold contacts, require one strong public-work hook and one very small ask.
- If a contact moved roles, treat that as a reconnect signal and rewrite the opener around the new role.
- If the recipient is blocked by the conflict check, do not send a work pitch.
- If a reply changes strategy or is ambiguous, pause and notify the user instead of guessing.
