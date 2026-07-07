# Outreach State Map

Date: 2026-07-07

Use this when you need to understand where the outreach workspace lives, what is source of truth, and how to back it up without sending private state to GitHub.

## Current Map

- `data/outreach/log.md` is the live send ledger.
- `data/outreach/contact-dossier.md` is the source-backed contact state.
- `data/outreach/drafts.md` is the draft mirror, not the ledger.
- `data/outreach/send-list.md` is the scheduling view.
- `data/outreach/queue.tsv` and `data/outreach/universe.tsv` are generated planning views.
- `data/outreach/targets.tsv` and `data/outreach/route-discovery.tsv` are the seed and routing tables.
- `data/outreach/operator-card.md` is the run sheet for the next agent.
- `data/outreach/*send-packet.md` are staged live-send packets.
- `data/archive/newlab-application-*.json` and `data/archive/newlab-application-*.png` are the Newlab application archive artifacts from this session.

## Backup Rule

- Run `npm run outreach:backup` after a live-send burst or a major outreach-state change.
- The default backup target is outside the repo at `C:\Users\<you>\.codex\backups\career-ops-outreach\`.
- The backup is meant for local recovery or a separate private mirror, not for the public GitHub repo.

## Sensitive Files

- `credentials.json` and `token.json` stay machine-local.
- `data/archive/newlab-application-*.json`, `data/archive/newlab-application-*.png`, `data/archive/submission_*.json`, and `data/archive/submission_*.png` are local-only application artifacts.
- Raw browser/session exports and other personal artifacts stay out of GitHub.
- If you mirror anything to a private repo, use redacted or encrypted copies only.

## Recovery Notes

- The backup command copies the outreach workspace and the current application artifacts into a timestamped snapshot.
- The snapshot is meant to let a future agent restore the current state without reopening the browser session.
- If you need a full machine-local restore, you can back up the auth files separately, but do not commit them to GitHub.
