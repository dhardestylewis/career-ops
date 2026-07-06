# Custom Operating Rules

## Outreach Preflight

- Before any live outreach send, create or update a send packet in `data/outreach/*send-packet.md`.
- Run `node src/dataOps/outreach-preflight.mjs --packet <send-packet-path>` before the message is pasted into LinkedIn, Gmail, or any other composer.
- If preflight fails, do not send. Fix the packet or the dossier first.
- If preflight reports that the greeting or body names the wrong person, treat that as a hard stop and re-open the recipient's dossier from scratch.
- Never send outreach directly from ad hoc draft text in chat or the browser composer; the send packet is the only approved staging surface.
