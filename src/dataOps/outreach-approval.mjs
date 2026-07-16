#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import {
  GLOBAL_APPROVAL_LEDGER,
  appendApprovalRecord,
  createApprovalRecord,
  messageSha256,
  readTsv,
} from '../core/outreach-send-gate.mjs';

function parseArgs(argv) {
  const args = { command: argv[0] || 'list' };
  for (let index = 1; index < argv.length; index++) {
    const value = argv[index];
    if (value === '--recipient') args.recipient = argv[++index];
    else if (value === '--organization') args.organization = argv[++index];
    else if (value === '--channel') args.channel = argv[++index];
    else if (value === '--lane') args.lane = argv[++index];
    else if (value === '--body-file') args.bodyFile = argv[++index];
    else if (value === '--chat-reference') args.chatReference = argv[++index];
    else if (value === '--approval-id') args.approvalId = argv[++index];
    else if (value === '--hours') args.hours = Number(argv[++index]);
    else if (value === '--i-have-current-chat-approval') args.confirmed = true;
  }
  return args;
}

function readBody(args) {
  if (!args.bodyFile || !existsSync(args.bodyFile)) throw new Error('Provide an existing --body-file containing only the exact message body.');
  return readFileSync(args.bodyFile, 'utf8');
}

const args = parseArgs(process.argv.slice(2));

if (args.command === 'hash') {
  console.log(messageSha256(readBody(args)));
} else if (args.command === 'list') {
  console.log(JSON.stringify(readTsv(GLOBAL_APPROVAL_LEDGER), null, 2));
} else if (args.command === 'grant') {
  if (!args.confirmed) throw new Error('Refusing to grant approval without --i-have-current-chat-approval. A queued batch, old approval, or inferred consent is not sufficient.');
  if (!args.recipient) throw new Error('--recipient is required.');
  if (!args.organization) throw new Error('--organization is required (use an explicit individual/context label when no company applies).');
  if (!args.lane) throw new Error('--lane is required.');
  if (!args.channel) throw new Error('--channel is required.');
  if (!args.chatReference) throw new Error('--chat-reference is required and must identify the current chat approval.');
  const message = readBody(args);
  const record = createApprovalRecord({
    recipient: args.recipient,
    organization: args.organization,
    lane: args.lane,
    channel: args.channel,
    message,
    chatReference: args.chatReference,
    hours: args.hours,
    approvalId: args.approvalId,
  });
  appendApprovalRecord(record);
  console.log(JSON.stringify(record, null, 2));
} else {
  throw new Error('Usage: outreach-approval.mjs list | hash --body-file <path> | grant --recipient <name> --organization <org/context> --lane <lane> --channel <channel> --body-file <path> --chat-reference <ref> --i-have-current-chat-approval [--hours <=24]');
}
